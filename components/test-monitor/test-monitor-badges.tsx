import { STATUS_TONE_STYLE, methodColorOf, serviceColorOf } from "@/components/logger/logger-utils";
import { flowServiceLabel } from "./test-monitor-utils";

const RESULT_TONE = { ok: "ok", err: "err", slow: "warn" } as const;

export function MethodTag({ method }: { method: string }) {
  const color = methodColorOf(method);
  return (
    <span
      className="w-max rounded-md px-2 py-0.5 font-mono text-[11px] font-bold"
      style={{ background: color.bg, color: color.text }}
    >
      {method}
    </span>
  );
}

export function ResultPill({ result, label }: { result: "ok" | "err" | "slow"; label: string }) {
  const tone = STATUS_TONE_STYLE[RESULT_TONE[result]];
  return (
    <span
      className="flex w-max items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: tone.bg, color: tone.text }}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      {label}
    </span>
  );
}

export function ServiceTag({ service }: { service: string }) {
  return (
    <span className="flex w-max items-center gap-1.5 rounded-md border border-[#E7EEEC] bg-white px-2 py-0.5 text-xs font-semibold text-[#16302b]">
      <span className="size-2 shrink-0 rounded-full" style={{ background: serviceColorOf(service) }} />
      {flowServiceLabel(service)}
    </span>
  );
}

/** Chuỗi service đi qua của 1 endpoint: `A › B › C`; 1 service thì chỉ là 1 tag. */
export function ServiceFlow({ services }: { services: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {services.map((service, i) => (
        <span key={service} className="flex items-center gap-1">
          {i > 0 && <span className="text-xs text-[#9AAEA9]">›</span>}
          <ServiceTag service={service} />
        </span>
      ))}
    </div>
  );
}
