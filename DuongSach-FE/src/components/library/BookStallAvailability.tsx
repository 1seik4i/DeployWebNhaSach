import { MapPin } from 'lucide-react';
import type { BookStall, Language } from '../../types';

export function BookStallAvailability({ stalls, language }: { stalls: BookStall[]; language: Language }) {
  return (
    <section className="book-stall-availability" aria-labelledby="book-stall-heading">
      <div className="book-stall-heading">
        <h3 id="book-stall-heading">{language === 'vi' ? 'Có tại các gian hàng' : 'Available at bookstalls'}</h3>
        <span className="book-stall-count">{stalls.length} {language === 'vi' ? 'gian hàng' : 'bookstalls'}</span>
      </div>
      <div className="book-stall-list">
        {stalls.map(stall => (
          <div className="book-stall-row" key={stall.id}>
            <div className="book-stall-main">
              <MapPin size={15} className="book-stall-pin-icon" aria-hidden="true" />
              <div className="book-stall-text">
                <div className="book-stall-title-row">
                  <strong className="book-stall-name">{stall.stallName}</strong>
                </div>
              </div>
            </div>
            <div className="book-stall-stock-wrap">
              <span className={`book-stall-stock-badge ${stall.inventoryQuantity === 0 ? 'is-out' : stall.inventoryQuantity <= 4 ? 'is-low' : ''}`}>
                {stall.inventoryQuantity === 0
                  ? (language === 'vi' ? 'Hết hàng' : 'Out of stock')
                  : language === 'vi' ? `Còn ${stall.inventoryQuantity} cuốn` : `${stall.inventoryQuantity} in stock`}
              </span>
            </div>
          </div>
        ))}
        {!stalls.length && (
          <p className="book-stall-empty-note">
            {language === 'vi' ? 'Chưa có thông tin tồn kho tại gian hàng.' : 'Bookstall availability is not available yet.'}
          </p>
        )}
      </div>
    </section>
  );
}
