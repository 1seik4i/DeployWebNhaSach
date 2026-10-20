import React, { useEffect, useState } from 'react';
import { 
  Shield, 
  Check, 
  RotateCcw, 
  Save, 
  Info,
  Briefcase,
  Lock
} from 'lucide-react';
import { 
  AdminRoleType, 
  AdminRolePermissionConfig, 
  AdminPermissionItem
} from '../../types/admin';
interface AdminRolesPermissionsViewProps {
  roleConfigs: Record<AdminRoleType, AdminRolePermissionConfig>;
  permissions: AdminPermissionItem[];
  onSaveRolePermissions: (roleId: AdminRoleType, permissionCodes: string[]) => void | Promise<void>;
  onResetDefaults: (roleId: AdminRoleType) => void | Promise<void>;
}

// These permissions are not configurable in the corresponding role's UI.
const isPermissionVisible = (roleId: AdminRoleType, permission: AdminPermissionItem) => {
  if (permission.code === 'account.login' || permission.module === 'system') return false;
  if (roleId !== 'partner') return true;
  return !['content', 'system'].includes(permission.module)
    && ![
      'activities.checkin',
      'activities.review',
      'library.moderate',
      'library.taxonomy.manage',
      'reports.organizer',
      'reports.system',
    ].includes(permission.code);
};

export const AdminRolesPermissionsView: React.FC<AdminRolesPermissionsViewProps> = ({
  roleConfigs,
  permissions,
  onSaveRolePermissions,
  onResetDefaults
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState<AdminRoleType>('admin');
  const [currentPermissions, setCurrentPermissions] = useState<Record<AdminRoleType, string[]>>({
    partner: [...(roleConfigs.partner?.assignedPermissionCodes || [])],
    admin: [...(roleConfigs.admin?.assignedPermissionCodes || [])]
  });
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    if (hasChanges) return;
    setCurrentPermissions({
      partner: [...(roleConfigs.partner?.assignedPermissionCodes || [])],
      admin: [...(roleConfigs.admin?.assignedPermissionCodes || [])],
    });
  }, [roleConfigs, hasChanges]);


  const activeRoleConfig = roleConfigs[selectedRoleId] || {
    roleId: selectedRoleId,
    roleName: selectedRoleId === 'partner' ? 'Đối tác / Gian hàng' : 'Quản trị viên',
    description: 'Đang tải cấu hình phân quyền',
    assignedPermissionCodes: [],
  };
  const activeAssignedCodes = currentPermissions[selectedRoleId] || [];
  const visiblePermissions = permissions.filter(item => isPermissionVisible(selectedRoleId, item));
  const visibleAssignedCount = visiblePermissions.filter(item => activeAssignedCodes.includes(item.code)).length;

  // Group permissions by module
  const groupedPermissions = React.useMemo(() => {
    const groups: Record<string, { label: string; items: AdminPermissionItem[] }> = {};
    permissions.forEach((item: AdminPermissionItem) => {
      if (!isPermissionVisible(selectedRoleId, item)) return;
      if (!groups[item.module]) {
        groups[item.module] = {
          label: item.moduleLabelVi,
          items: []
        };
      }
      groups[item.module].items.push(item);
    });
    return groups;
  }, [permissions, selectedRoleId]);

  const handleTogglePermission = (code: string) => {
    if (selectedRoleId === 'admin' && code === 'system.roles.manage') {
      // Prevent locking oneself out of role management
      return;
    }

    const isAssigned = activeAssignedCodes.includes(code);
    let updated: string[];
    if (isAssigned) {
      updated = activeAssignedCodes.filter(c => c !== code);
    } else {
      updated = [...activeAssignedCodes, code];
    }

    setCurrentPermissions(prev => ({
      ...prev,
      [selectedRoleId]: updated
    }));
    setHasChanges(true);
    setSaveSuccessNotice(null);
  };

  const handleSave = async () => {
    try {
      await onSaveRolePermissions(selectedRoleId, activeAssignedCodes);
      setHasChanges(false);
      setSaveSuccessNotice(`Đã lưu thành công cấu hình phân quyền cho vai trò "${activeRoleConfig.roleName}".`);
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    } catch (error) {
      setSaveSuccessNotice(error instanceof Error ? error.message : 'Không thể lưu cấu hình phân quyền.');
    }
  };

  const handleReset = async () => {
    await onResetDefaults(selectedRoleId);
    setCurrentPermissions(prev => ({
      ...prev,
      [selectedRoleId]: [...(roleConfigs[selectedRoleId]?.assignedPermissionCodes || [])]
    }));
    setHasChanges(false);
  };

  const getRoleIcon = (roleId: AdminRoleType) => {
    switch (roleId) {
      case 'partner': return <Briefcase size={16} />;
      case 'admin': return <Lock size={16} />;
    }
  };

  return (
    <div className="adm-roles-view">
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Vai trò & Phân quyền</h1>
          <p className="adm-page-subtitle">
            Cấu hình quyền hạn cho quản trị viên và đối tác/gian hàng.
          </p>
        </div>
        <div className="adm-page-header-actions">
          {hasChanges && (
            <button 
              className="adm-btn adm-btn-secondary"
              onClick={handleReset}
            >
              <RotateCcw size={16} />
              <span>Khôi phục ban đầu</span>
            </button>
          )}
          <button 
            className="adm-btn adm-btn-primary"
            onClick={handleSave}
            disabled={!hasChanges}
          >
            <Save size={16} />
            <span>Lưu thay đổi</span>
          </button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div className="adm-toast-banner">
          <Check size={16} />
          <span>{saveSuccessNotice}</span>
        </div>
      )}

      {/* Role Selection Tabs */}
      <div className="adm-card adm-role-selector-card">
        <div className="adm-role-tabs-row">
          {(['partner', 'admin'] as AdminRoleType[]).map((rId) => {
            const isSelected = selectedRoleId === rId;
            const count = permissions.filter(item => isPermissionVisible(rId, item)
              && (currentPermissions[rId] || []).includes(item.code)).length;
            return (
              <button
                key={rId}
                className={`adm-role-tab-btn ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setSelectedRoleId(rId);
                  setSaveSuccessNotice(null);
                }}
              >
                <div className="adm-role-tab-icon">
                  {getRoleIcon(rId)}
                </div>
                <div className="adm-role-tab-text">
                  <span className="adm-role-tab-name">{rId === 'partner' ? 'Đối tác / Gian hàng' : 'Quản trị viên'}</span>
                  <span className="adm-role-tab-count">{count} quyền được cấp</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role Overview Description Card */}
      <div className="adm-card adm-role-meta-card">
        <div className="adm-role-meta-header">
          <div className="adm-role-meta-icon">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="adm-role-meta-title">{activeRoleConfig.roleName}</h3>
            <p className="adm-role-meta-desc">{activeRoleConfig.description}</p>
          </div>
        </div>
        <div className="adm-role-meta-stat">
          Đang kích hoạt <strong>{visibleAssignedCount}</strong> trên tổng số <strong>{visiblePermissions.length}</strong> quyền hiển thị.
        </div>
      </div>

      {/* Permission Groups */}
      <div className="adm-permissions-container">
        {Object.entries(groupedPermissions).map(([moduleKey, group]) => {
          const groupCodes = group.items.map(i => i.code);
          const enabledInGroupCount = groupCodes.filter(c => activeAssignedCodes.includes(c)).length;

          return (
            <div key={moduleKey} className="adm-card adm-perm-module-card">
              <div className="adm-perm-module-header">
                <div>
                  <h4 className="adm-perm-module-title">{group.label}</h4>
                  <span className="adm-perm-module-count">
                    {enabledInGroupCount}/{group.items.length} quyền bật
                  </span>
                </div>
              </div>

              <div className="adm-perm-list">
                {group.items.map((perm) => {
                  const isChecked = activeAssignedCodes.includes(perm.code);
                  const isLockedAdminRule = selectedRoleId === 'admin' && perm.code === 'system.roles.manage';

                  return (
                    <div key={perm.id} className="adm-perm-row">
                      <div className="adm-perm-info">
                        <div className="adm-perm-name-row">
                          <span className="adm-perm-name">{perm.name}</span>
                        </div>
                        <p className="adm-perm-desc">{perm.description}</p>
                      </div>

                      <div className="adm-perm-action">
                        <label className="adm-toggle-label">
                          <input 
                            type="checkbox"
                            className="adm-toggle-checkbox"
                            checked={isChecked}
                            disabled={isLockedAdminRule}
                            onChange={() => handleTogglePermission(perm.code)}
                          />
                          <span className="adm-toggle-slider"></span>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Save bar if dirty */}
      {hasChanges && (
        <div className="adm-floating-save-bar">
          <div className="adm-floating-text">
            <Info size={16} />
            <span>Bạn có thay đổi chưa lưu cho vai trò này.</span>
          </div>
          <div className="adm-floating-actions">
            <button 
              className="adm-btn adm-btn-secondary"
              onClick={handleReset}
            >
              Hủy
            </button>
            <button 
              className="adm-btn adm-btn-primary"
              onClick={handleSave}
            >
              Lưu thay đổi ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

