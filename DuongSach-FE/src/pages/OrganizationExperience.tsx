import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { landingContentService } from '../services/landingContentService';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Language } from '../types';
import './OrganizationExperience.css';

interface OrganizationExperienceProps {
  language: Language;
  open: boolean;
}

export const OrganizationExperience: React.FC<OrganizationExperienceProps> = ({ language, open }) => {
  const vi = language === 'vi';
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);


  // Lock body scroll when sheet is open
  useLayoutEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('organization-experience-open');
    return () => {
      document.body.style.overflow = oldOverflow;
      document.body.classList.remove('organization-experience-open');
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const oldTitle = document.title;
    document.title = vi
      ? 'Bộ Máy Tổ Chức — Đường Sách TP. Hồ Chí Minh'
      : 'Governance & Leadership — HCMC Book Street';

    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
    }

    return () => {
      document.title = oldTitle;
    };
  }, [open, vi]);

  const [orgData, setOrgData] = useState(() => landingContentService.getOrganization());

  useEffect(() => {
    const handleUpdate = () => {
      setOrgData(landingContentService.getOrganization());
    };
    handleUpdate();
    void landingContentService.refreshPublic().then(handleUpdate);
    window.addEventListener('duongsach_landing_content_changed', handleUpdate);
    return () => window.removeEventListener('duongsach_landing_content_changed', handleUpdate);
  }, []);

  const parseLeaderName = (nameVi: string) => {
    if (!nameVi) return { prefix: '', name: '' };
    const prefixes = ['Ông ', 'Bà ', 'TS. ', 'PGS.TS. ', 'ThS. '];
    for (const p of prefixes) {
      if (nameVi.startsWith(p)) {
        return { prefix: p.trim(), name: nameVi.substring(p.length).trim().toUpperCase() };
      }
    }
    return { prefix: '', name: nameVi.trim().toUpperCase() };
  };

  const tier1Leaders = (orgData.leaders || []).filter(l => (l.tier || 1) === 1);
  const tier2Leaders = (orgData.leaders || []).filter(l => l.tier === 2);
  const tier3Leaders = (orgData.leaders || []).filter(l => (l.tier || 3) === 3);

  return (
    <div 
      ref={panelRef}
      id="organization-page-panel"
      className={`org-sheet ${open ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={vi ? 'Bộ máy tổ chức Đường Sách TP.HCM' : 'Organization Structure'}
    >
      <main className="org-document">
        {/* Top Sticky Navigation Bar */}
        <div className="org-topbar">
          <div className="org-container org-topbar-content">
            <button
              type="button"
              className="org-back-btn"
              onClick={() => navigate('/')}
              title={vi ? 'Trang chủ' : 'Back to Home'}
            >
              <ArrowLeft size={16} />
              <span>{vi ? 'Trang chủ' : 'Back to Home'}</span>
            </button>

            <div className="org-breadcrumbs">
              <Link to="/">{vi ? 'Trang chủ' : 'Home'}</Link>
              <ChevronRight size={13} />
              <span className="active">{vi ? 'Bộ máy tổ chức' : 'Organization'}</span>
            </div>
          </div>
        </div>

        {/* 1. Hero Banner matching "Về Đường Sách" FPTU Signature Style */}
        <section className="org-hero-fptu">
          <div className="org-hero-bg-photo" aria-hidden="true" />
          <div className="org-hero-gradient-overlay" aria-hidden="true" />

          <div className="org-hero-container">
            <div className="org-hero-brand-lockup">
              <div className="org-hero-era">
                <span />
                <i>{orgData.hero?.era || ''}</i>
                <span />
              </div>

              <h1 className="org-hero-title">
                <span>{orgData.hero?.title || ''}</span>
              </h1>

              <p className="org-hero-lead">
                {orgData.hero?.lead || ''}
              </p>
            </div>
          </div>
        </section>

        {/* 2. Leadership Directory Section (Campus FPTU 3-Tier Photo Architecture) */}
        <section className="org-directory-section">
          <div className="org-container">
            {/* Header */}
            <div className="org-fptu-header-card">
              <h2 className="org-fptu-main-title">
                {orgData.directory?.titleLine1}{' '}
                <span className="org-fptu-title-highlight">
                  {orgData.directory?.titleHighlight}
                </span>
              </h2>

              <div className="org-fptu-divider-flourish" aria-hidden="true">
                <span className="flourish-line" />
                <span className="flourish-dot" />
                <span className="flourish-diamond">❖</span>
                <span className="flourish-dot" />
                <span className="flourish-line" />
              </div>

              <p className="org-fptu-subtitle">
                {orgData.directory?.subtitle || ''}
              </p>
            </div>

            {/* 3-TIER HIERARCHICAL ORGANIZATION TREE */}
            <div className="org-tree-wrapper">
              {/* TẦNG 1 (ĐỈNH) - VỊ TRÍ LÃNH ĐẠO CAO NHẤT */}
              {tier1Leaders.length > 0 && (
                <div className="org-tree-tier tier-1">
                  {tier1Leaders.map((leader) => {
                    const { prefix, name } = parseLeaderName(leader.nameVi);
                    return (
                      <div
                        key={leader.id}
                        className="org-tree-card tier-1-card"
                      >
                        <div className="org-tree-avatar-box tier-1-avatar">
                          <img
                            src={leader.imageUrl}
                            alt={leader.nameVi}
                            className="org-tree-avatar-img"
                            loading="lazy"
                          />
                        </div>
                        <div className="org-tree-info">
                          {prefix && <span className="org-tree-prefix">{prefix}</span>}
                          <h3 className="org-tree-name">{name}</h3>
                          <p className="org-tree-role">{leader.roleVi}</p>
                          {leader.subVi && <p className="org-tree-sub">{leader.subVi}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TẦNG 2 (GIỮA) - BAN ĐIỀU HÀNH & PHÓ GIÁM ĐỐC */}
              {tier2Leaders.length > 0 && (
                <div className="org-tree-tier tier-2">
                  {tier2Leaders.map((leader) => {
                    const { prefix, name } = parseLeaderName(leader.nameVi);
                    return (
                      <div
                        key={leader.id}
                        className="org-tree-card tier-2-card"
                      >
                        <div className="org-tree-avatar-box tier-2-avatar">
                          <img
                            src={leader.imageUrl}
                            alt={leader.nameVi}
                            className="org-tree-avatar-img"
                            loading="lazy"
                          />
                        </div>
                        <div className="org-tree-info">
                          {prefix && <span className="org-tree-prefix">{prefix}</span>}
                          <h3 className="org-tree-name">{name}</h3>
                          <p className="org-tree-role">{leader.roleVi}</p>
                          {leader.subVi && <p className="org-tree-sub">{leader.subVi}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TẦNG 3 (DƯỚI CÙNG) - TRƯỞNG CÁC BAN CHUYÊN MÔN */}
              {tier3Leaders.length > 0 && (
                <div className="org-tree-tier tier-3">
                  {tier3Leaders.map((leader) => {
                    const { prefix, name } = parseLeaderName(leader.nameVi);
                    return (
                      <div
                        key={leader.id}
                        className="org-tree-card tier-3-card"
                      >
                        <div className="org-tree-avatar-box tier-3-avatar">
                          <img
                            src={leader.imageUrl}
                            alt={leader.nameVi}
                            className="org-tree-avatar-img"
                            loading="lazy"
                          />
                        </div>
                        <div className="org-tree-info">
                          {prefix && <span className="org-tree-prefix">{prefix}</span>}
                          <h3 className="org-tree-name">{name}</h3>
                          <p className="org-tree-role">{leader.roleVi}</p>
                          {leader.subVi && <p className="org-tree-sub">{leader.subVi}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Core Operating Principles Section */}
        <section className="org-principles-section">
          <div className="org-container">
            <div className="org-section-header light">
              <span className="org-section-kicker gold">{vi ? 'TRIẾT LÝ VẬN HÀNH' : 'OPERATING PRINCIPLES'}</span>
              <h2 className="org-section-heading light">
                {vi ? `${orgData.principles.length} Trụ Cột Quản Trị` : `${orgData.principles.length} Governance Pillars`}
              </h2>
              <p className="org-principles-header-desc">
                {vi
                  ? 'Những định hướng cốt lõi định hình sự phát triển bền vững và sứ mệnh văn hóa của Đường Sách TP.HCM.'
                  : 'Core principles shaping sustainable growth and the cultural mission of Book Street.'}
              </p>
            </div>

            <div className="org-principles-grid">
              {(orgData.principles || []).map((p, idx) => (
                <div key={idx} className="org-principle-card">
                  <div className="org-principle-badge">{p.num}</div>
                  <h3 className="org-principle-title">{p.title}</h3>
                  <p className="org-principle-text">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
