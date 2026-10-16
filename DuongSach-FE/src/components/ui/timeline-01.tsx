import { Badge } from './badge';
import Timeline, { type TimelineItem } from './timeline-01-utils/timeline';
import './timeline-01.css';

interface TimelineBlock01Props {
  badge?: React.ReactNode;
  title: React.ReactNode;
  description: React.ReactNode;
  items: TimelineItem[];
}

export type { TimelineItem } from './timeline-01-utils/timeline';

export default function TimelineBlock01({ badge, title, description, items }: TimelineBlock01Props) {
  return (
    <section className="timeline-01">
      <div className="timeline-01-heading">
        {badge && <Badge variant="outline">{badge}</Badge>}
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <Timeline items={items} />
    </section>
  );
}
