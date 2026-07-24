import { CardListSkeleton, DeckHeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <>
      <DeckHeaderSkeleton />
      <div className="mt-8">
        <CardListSkeleton />
      </div>
    </>
  );
}
