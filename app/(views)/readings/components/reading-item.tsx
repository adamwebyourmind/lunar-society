"use client";

import { useReadingsContext } from "lib/contexts/readings-context";
import { useRouter } from "next/navigation";
import Card from "components/card";
import ReadingItemMenu from "./reading-item-menu";
import Link from "next/link";
import { TarotSession } from "lib/database/tarotSessions.database";

type ReadingItemProps = {
  tarotSession: TarotSession;
};

function ReadingItem({ tarotSession }: ReadingItemProps) {
  const { setReading } = useReadingsContext();
  const router = useRouter();
  const handleClick = (e) => {
    e.preventDefault();
    setReading(tarotSession);
    router.push(`/readings/${tarotSession.id}`);
  };

  return (
    <Card className="pt-6">
      <>
        <div className="flex items-center justify-between">
          <p className="mb-1 text-xs opacity-70">{new Date(tarotSession.createdAt).toDateString()}</p>
          <ReadingItemMenu readingId={tarotSession.id} />
        </div>
        <Link
          href={`readings/${tarotSession.id}`}
          onClick={handleClick}
          className={"flex flex-col space-y-2 text-foreground"}
        >
          {tarotSession.readings[0].cards.map((card) => (
            <h3 key={card.cardName} className="my-0 text-primary">
              {card.cardName}
            </h3>
          ))}
          <p className="font-normal italic">{tarotSession.readings[0].userQuery || "Open Reading"}</p>
        </Link>
      </>
    </Card>
  );
}

export default ReadingItem;
