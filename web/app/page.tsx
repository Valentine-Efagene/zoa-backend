import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, FileCheck2, Landmark, Users } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Building2,
    title: "Company registration",
    description:
      "Incorporate with CAC — directors, shareholders, and supporting documents captured in one guided flow.",
  },
  {
    icon: Landmark,
    title: "Business name",
    description:
      "Register a business name with clear steps, identity capture, and uploads ready for filing.",
  },
  {
    icon: FileCheck2,
    title: "SCUML filings",
    description:
      "Prepare SCUML applications with structured fields and the documents regulators expect.",
  },
];

const steps = [
  {
    step: "01",
    title: "Choose a workflow",
    description: "Pick company, business name, or SCUML and start a draft instantly.",
  },
  {
    step: "02",
    title: "Capture people & docs",
    description:
      "Add directors, shareholders, trustees, and upload IDs or forms as you go.",
  },
  {
    step: "03",
    title: "Submit for filing",
    description:
      "Review once, submit, and track status while Z.O.A handles the CAC process.",
  },
];

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      {/* Hero — photo + deep brand veil for contrast */}
      <section className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-[#0a2f5c]">
        <Image
          src="/hero/registration-consult.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[72%_center] zoa-hero-kenburns"
          aria-hidden
        />
        {/* Dual-axis brand veil: strong left for copy, photo readable on the right */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              linear-gradient(
                105deg,
                rgba(8, 32, 64, 0.94) 0%,
                rgba(10, 47, 92, 0.88) 34%,
                rgba(19, 69, 139, 0.62) 58%,
                rgba(19, 69, 139, 0.38) 78%,
                rgba(10, 47, 92, 0.45) 100%
              ),
              linear-gradient(
                to top,
                rgba(8, 32, 64, 0.55) 0%,
                transparent 42%
              )
            `,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/4 size-[28rem] rounded-full opacity-25 blur-3xl"
          style={{ background: "#ff9933" }}
        />

        <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="inline-flex">
            <BrandLogo onDark />
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/login" />}
            >
              Sign in
            </Button>
            <Button
              className="bg-[var(--zoa-orange)] text-[#0a2f5c] hover:bg-[#ffad57]"
              render={<Link href="/signup" />}
            >
              Get started
            </Button>
          </div>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-24 pt-6">
          <div className="max-w-lg zoa-rise">
            <h1 className="font-[family-name:var(--font-display)] text-[clamp(3.25rem,11vw,6.75rem)] leading-[0.9] font-semibold tracking-tight text-[var(--zoa-orange)]">
              Z.O.A
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-white/90 zoa-rise-delay sm:text-xl">
              Lawyer-led help registering your company, business name, or SCUML
              filing — guided forms, documents, and progress in one place.
            </p>
            <div className="mt-9 flex flex-wrap gap-3 zoa-rise-delay-2">
              <Button
                size="lg"
                className="bg-[var(--zoa-orange)] text-[#0a2f5c] shadow-md hover:bg-[#ffad57]"
                render={<Link href="/signup" />}
              >
                Start filing
                <ArrowRight className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
                render={<Link href="/login" />}
              >
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services — ruled document grid */}
      <section className="relative border-t border-[var(--zoa-blue)]/15 zoa-pattern-documents">
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <p className="text-sm font-medium tracking-[0.18em] text-[var(--zoa-orange)] uppercase">
            What we file
          </p>
          <h2 className="mt-3 max-w-xl font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--zoa-blue)] sm:text-4xl">
            Legal help to get your business registered
          </h2>
          <p className="mt-4 max-w-lg text-muted-foreground">
            Z.O.A Corporate Service Limited — lawyer-guided CAC filings so
            founders get company, business name, and SCUML applications done
            without the paperwork maze.
          </p>

          <ul className="mt-14 divide-y divide-[var(--zoa-blue)]/12 border-y border-[var(--zoa-blue)]/12">
            {services.map((service) => (
              <li
                key={service.title}
                className="grid gap-4 py-8 sm:grid-cols-[auto_1fr] sm:gap-8 sm:py-10"
              >
                <service.icon
                  className="size-8 text-[var(--zoa-blue)]"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-foreground">
                    {service.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works — seal / notary motif */}
      <section className="relative zoa-pattern-seal">
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <p className="text-sm font-medium tracking-[0.18em] text-[var(--zoa-orange)] uppercase">
            How it works
          </p>
          <h2 className="mt-3 max-w-md font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--zoa-blue)] sm:text-4xl">
            From draft to filed
          </h2>

          <ol className="mt-14 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {steps.map((item) => (
              <li key={item.step}>
                <span className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight text-[var(--zoa-orange)]">
                  {item.step}
                </span>
                <h3 className="mt-4 font-medium text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Multi-person — folio / document icon pattern */}
      <section className="relative border-y border-[var(--zoa-blue)]/12 zoa-pattern-folio">
        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-6 py-16 sm:flex-row sm:items-center sm:justify-between sm:py-20">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 text-[var(--zoa-blue)]">
              <Users className="size-5" strokeWidth={1.5} aria-hidden />
              <span className="text-sm font-medium tracking-wide uppercase">
                Built for teams of people
              </span>
            </div>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--zoa-blue)] sm:text-4xl">
              Every director, owner, and trustee — captured cleanly
            </h2>
            <p className="mt-4 text-muted-foreground">
              Multi-person forms and document uploads stay attached to the right
              role, so filings stay complete before they leave your desk.
            </p>
          </div>
          <Button
            size="lg"
            className="shrink-0 self-start sm:self-center"
            render={<Link href="/signup" />}
          >
            Open your dashboard
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </section>

      {/* Closing CTA — column motif on brand blue */}
      <section className="relative overflow-hidden zoa-pattern-columns">
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
          <h2 className="max-w-lg font-[family-name:var(--font-display)] text-3xl tracking-tight text-white sm:text-5xl">
            Ready when your next filing is
          </h2>
          <p className="mt-4 max-w-md text-white/80">
            Create an account, start a draft, and move through CAC requirements
            without the spreadsheet scramble.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              className="bg-[var(--zoa-orange)] text-[#0a2f5c] hover:bg-[#ffad57]"
              render={<Link href="/signup" />}
            >
              Get started
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
              render={<Link href="/login" />}
            >
              I already have an account
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--zoa-blue)]/12 bg-[var(--zoa-canvas)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <BrandLogo showTagline />
            <p className="mt-4 text-sm text-muted-foreground">
              Corporate Service Limited · RC NO: 8238803
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-foreground">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
