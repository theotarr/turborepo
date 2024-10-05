import { NativeNotesPage } from "@/components/native-notes";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface LecturePageProps {
  params: { id: string };
  searchParams: {
    theme?: string;
  };
}

export default async function NativePage({
  params,
  searchParams,
}: LecturePageProps) {
  const { data: lecture } = await supabase
    .from("Lecture")
    .select("*")
    .eq("id", params.id)
    .single();
  if (!lecture) return <>Loading...</>;

  return (
    <div className="bg-background">
      <NativeNotesPage lecture={lecture} />
    </div>
  );
}
