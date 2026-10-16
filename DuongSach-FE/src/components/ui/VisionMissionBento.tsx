import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Network, Sparkles, Upload } from 'lucide-react';
import type { JourneyContent } from '../../services/landingContentService';
import './VisionMissionBento.css';

export interface VisionMissionBentoProps {
  language: 'vi' | 'en';
  data?: JourneyContent['visionMission'];
  isEditable?: boolean;
  onUpdate?: (updates: Partial<JourneyContent['visionMission']>) => void;
  openImagePicker?: (url: string, title: string, onSave: (url: string) => void) => void;
}

export default function VisionMissionBento({
  language,
  data,
  isEditable = false,
  onUpdate,
  openImagePicker
}: VisionMissionBentoProps) {
  const vi = language === 'vi';
  const reduceMotion = useReducedMotion();
  const hoverMotion = reduceMotion ? undefined : { y: -5 };

  const renderEditable = (
    value: string | undefined,
    _defaultText: string,
    field: keyof JourneyContent['visionMission'],
    tag: 'span' | 'h2' | 'h3' | 'p' = 'span',
    className = ''
  ) => {
    const text = value || '';
    const Tag = tag;
    if (!isEditable) {
      return <Tag className={className}>{text}</Tag>;
    }
    return (
      <Tag
        className={`cms-live-editable ${className}`}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={field === 'visionTitle' ? (vi ? 'Tiêu đề tầm nhìn' : 'Vision title') : field === 'visionDesc' ? (vi ? 'Mô tả tầm nhìn' : 'Vision description') : undefined}
        data-placeholder={vi ? 'Bấm để chỉnh sửa' : 'Click to edit'}
        style={{ minWidth: '1ch', minHeight: '1em' }}
        onBlur={(e: React.FocusEvent<HTMLElement>) => {
          const newVal = e.currentTarget.textContent?.trim() || '';
          if (newVal !== text && onUpdate) {
            onUpdate({ [field]: newVal });
          }
        }}
      >
        {text}
      </Tag>
    );
  };

  const missionPoints = data?.missionPoints || [];

  return (
    <div className="vision-bento">
      <header className="vision-bento__intro" data-journey-reveal="up">
        <div className="vision-bento__heading-group">
          <h2 className="vision-bento__main-title">
            <span className="vision-bento__title-line">
              {renderEditable(data?.introTitleLine1, vi ? 'Kiến tạo một đô thị đọc,' : 'Building a reading city,', 'introTitleLine1', 'span')}
            </span>
            <span className="vision-bento__title-line vision-title-accent">
              {renderEditable(data?.introTitleLine2, vi ? 'từ một con đường mở.' : 'from one open street.', 'introTitleLine2', 'span')}
            </span>
          </h2>
        </div>
        <div className="vision-bento__desc-box">
          <p>
            {renderEditable(
              data?.introDesc,
              vi
                ? 'Đường Sách TP.HCM hướng đến một hệ sinh thái tri thức mở, nơi di sản lịch sử, văn hóa đọc và đời sống cộng đồng cùng phát triển bền vững.'
                : 'HCMC Book Street builds an accessible knowledge ecosystem where heritage, reading culture, and community grow together.',
              'introDesc',
              'span'
            )}
          </p>
        </div>
      </header>

      <div className="vision-bento__grid">
        {/* Card 1: Tầm nhìn */}
        <motion.article
          className="vision-bento__card vision-bento__card--vision"
          whileHover={isEditable ? undefined : hoverMotion}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          data-journey-reveal="left"
        >
          <div
            className={isEditable ? 'editable-image-wrapper' : ''}
            style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 0, cursor: isEditable ? 'pointer' : 'default' }}
            onClick={() => {
              if (isEditable && openImagePicker) {
                openImagePicker(data?.visionImage || '', 'Ảnh Tầm nhìn', (url) => {
                  if (onUpdate) onUpdate({ visionImage: url });
                });
              }
            }}
          >
            {data?.visionImage && <img src={data.visionImage} alt={vi ? 'Toàn cảnh Đường Sách TP.HCM' : 'HCMC Book Street overview'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            {isEditable && (
              <div className="editable-image-overlay">
                <Upload size={18} />
                <span>{vi ? 'Thay ảnh Tầm nhìn' : 'Change Image'}</span>
              </div>
            )}
          </div>
          <div className="vision-bento__shade" aria-hidden="true" style={{ pointerEvents: 'none' }} />
          {isEditable && openImagePicker && (
            <button
              type="button"
              className="vision-bento__edit-image"
              onClick={() => openImagePicker(data?.visionImage || '', vi ? 'Ảnh nền Tầm nhìn' : 'Vision background', visionImage => onUpdate?.({ visionImage }))}
            >
              <Upload size={16} />{vi ? 'Thay ảnh nền' : 'Change background'}
            </button>
          )}
          <div className="vision-bento__body" style={{ position: 'relative', zIndex: 2 }}>
            <span className="vision-bento__label">{vi ? 'Tầm nhìn' : 'Vision'}</span>
            <h3>
              {renderEditable(data?.visionTitle, vi ? 'Biểu tượng văn hóa đọc mở của Việt Nam' : 'Vietnam’s open icon of reading culture', 'visionTitle', 'span')}
            </h3>
            <p>
              {renderEditable(
                data?.visionDesc,
                vi
                  ? 'Trở thành không gian văn hóa tri thức tiêu biểu của Việt Nam và Đông Nam Á, kết nối di sản đô thị với nhịp sống sáng tạo đương đại.'
                  : 'To become a leading knowledge and cultural space in Vietnam and Southeast Asia, connecting urban heritage with contemporary creativity.',
                'visionDesc',
                'span'
              )}
            </p>
          </div>
        </motion.article>

        {/* Card 2: Sứ mệnh */}
        <motion.article
          className="vision-bento__card vision-bento__card--mission"
          whileHover={hoverMotion}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          data-journey-reveal="right"
        >
          <div className="vision-bento__body">
            <span className="vision-bento__label">{vi ? 'Sứ mệnh' : 'Mission'}</span>
            <h3>
              {renderEditable(data?.missionTitle, vi ? 'Đưa sách và con người đến gần nhau hơn' : 'Bringing books and people closer together', 'missionTitle', 'span')}
            </h3>
            <p>
              {renderEditable(
                data?.missionDesc,
                vi
                  ? 'Nuôi dưỡng thói quen đọc, kết nối tác giả với độc giả và đồng hành cùng ngành xuất bản trong hành trình lan tỏa tri thức.'
                  : 'Cultivating reading habits, connecting authors with readers, and advancing the publishing ecosystem.',
                'missionDesc',
                'span'
              )}
            </p>
            <ul>
              {missionPoints.map((pt, pIdx) => (
                <li key={pIdx}>
                  {!isEditable ? (
                    pt
                  ) : (
                    <span
                      className="cms-live-editable"
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const next = [...missionPoints];
                        next[pIdx] = e.currentTarget.textContent?.trim() || pt;
                        if (onUpdate) onUpdate({ missionPoints: next });
                      }}
                    >
                      {pt}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </motion.article>

        {/* Card 3: Tiếp cận mở */}
        <motion.article
          className="vision-bento__card vision-bento__card--support vision-bento__card--open"
          whileHover={hoverMotion}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          data-journey-reveal="up"
        >
          <BookOpen size={22} />
          <span className="vision-bento__label">{vi ? 'Tiếp cận mở' : 'Open access'}</span>
          <h3>
            {renderEditable(data?.openAccessTitle, vi ? 'Tri thức dành cho tất cả' : 'Knowledge for everyone', 'openAccessTitle', 'span')}
          </h3>
          <p>
            {renderEditable(
              data?.openAccessDesc,
              vi
                ? 'Không gian miễn phí, thân thiện và dễ tiếp cận cho trẻ em, gia đình, người cao tuổi và du khách.'
                : 'A free, welcoming place for children, families, seniors, and visitors.',
              'openAccessDesc',
              'span'
            )}
          </p>
        </motion.article>

        {/* Card 4: Kết nối cộng đồng */}
        <motion.article
          className="vision-bento__card vision-bento__card--support vision-bento__card--network"
          whileHover={hoverMotion}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          data-journey-reveal="up"
        >
          <Network size={22} />
          <span className="vision-bento__label">{vi ? 'Kết nối cộng đồng' : 'Community connection'}</span>
          <h3>
            {renderEditable(data?.networkTitle, vi ? 'Một điểm hẹn, nhiều tiếng nói' : 'One meeting place, many voices', 'networkTitle', 'span')}
          </h3>
          <p>
            {renderEditable(
              data?.networkDesc,
              vi
                ? 'Kết nối nhà xuất bản, tác giả, trường học, tổ chức văn hóa và bạn đọc qua các hoạt động quanh năm.'
                : 'Connecting publishers, authors, schools, cultural organizations, and readers year-round.',
              'networkDesc',
              'span'
            )}
          </p>
        </motion.article>

        {/* Card 5: Đổi mới sáng tạo */}
        <motion.article
          className="vision-bento__card vision-bento__card--support vision-bento__card--future"
          whileHover={hoverMotion}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}
          data-journey-reveal="up"
        >
          <div className="vision-bento__support-icons" aria-hidden="true">
            <Sparkles size={22} />
          </div>
          <span className="vision-bento__label">{vi ? 'Đổi mới bền vững' : 'Sustainable innovation'}</span>
          <h3>
            {renderEditable(data?.innovationTitle, vi ? 'Di sản bước vào kỷ nguyên số' : 'Heritage enters the digital era', 'innovationTitle', 'span')}
          </h3>
          <p>
            {renderEditable(
              data?.innovationDesc,
              vi
                ? 'Phát triển bản đồ số, mã QR di sản và trải nghiệm tương tác trong một không gian xanh được gìn giữ.'
                : 'Developing digital maps, heritage QR experiences, and interaction while protecting the green canopy.',
              'innovationDesc',
              'span'
            )}
          </p>
        </motion.article>
      </div>
    </div>
  );
}
