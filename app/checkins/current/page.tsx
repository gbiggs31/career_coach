import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { ensureCurrentWeekCheckin, serializeCheckinAnswers } from "@/lib/services/checkin-service";
import { CheckinForm } from "@/components/checkin-form";

export default async function CurrentCheckinPage() {
  const user = await requireUser();
  const checkin = await ensureCurrentWeekCheckin(user.id);

  if (checkin.status === "submitted") {
    redirect(`/checkins/${checkin.id}`);
  }

  const answers = await serializeCheckinAnswers(checkin.id);

  return (
    <main className="app-shell">
      <section className="page-header">
        <div>
          <div className="pill">Estimated time: 5 minutes</div>
          <h1>This week with Coach Aesop</h1>
          <p>
            A gentle end-of-week reset. Capture the work, the friction, and what matters next while it is still fresh, then let the coaching layer
            help you spot the pattern.
          </p>
        </div>
        <div className="page-side-note">
          <span className="eyebrow">Suggested flow</span>
          <p>Start with where your time really went, move through wins and struggles, then finish by choosing what next week needs from you.</p>
        </div>
      </section>
      <CheckinForm checkinId={checkin.id} initialAnswers={answers} />
    </main>
  );
}
