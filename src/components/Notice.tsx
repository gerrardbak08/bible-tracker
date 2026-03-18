import { Info } from "lucide-react";

export default function Notice() {
  return (
    <div className="rounded-xl border bg-slate-50/50 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
          <Info size={16} />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">암송 안내 및 원칙</h2>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-slate-400" />
              <p className="text-[12px] font-medium text-slate-600 leading-relaxed">
                총 18구절의 모든 말씀을 완송하는 것을 지향합니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-indigo-500" />
              <p className="text-[12px] font-medium text-slate-600 leading-relaxed">
                본인이 담당한 <span className="font-bold text-slate-900">3개의 필수 구절</span>은 반드시 암송해야 합니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
