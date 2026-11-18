// src/components/NumInput.jsx
// حقل رقمي يعرض الأرقام اللاتينية دائماً (Chrome يعرّب أرقام <input type="number"> حسب لغة الجهاز)
// ويقبل الأرقام العربية/الفارسية من لوحة المفاتيح ويحوّلها تلقائياً.

const ARABIC_ZERO = 0x0660; // ٠
const PERSIAN_ZERO = 0x06f0; // ۰

const normalizeNumber =(raw, { decimal = true } = {}) => {
  let s = String(raw ?? '')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - ARABIC_ZERO))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - PERSIAN_ZERO))
    .replace(/[٫,،]/g, '.');

  s = s.replace(decimal ? /[^0-9.]/g : /[^0-9]/g, '');
  if (decimal) {
    const first = s.indexOf('.');
    if (first !== -1) s = s.slice(0, first + 1) + s.slice(first + 1).replace(/\./g, '');
  }
  return s;
};

export default function NumInput({ onChange, step, min, inputMode, ...props }) {
  // الأعداد الصحيحة: إذا لم يُحدد step بقيمة عشرية
  const decimal = step !== undefined && String(step).includes('.');
  return (
    <input
      type="text"
      inputMode={inputMode || (decimal ? 'decimal' : 'numeric')}
      autoComplete="off"
      data-min={min}
      {...props}
      onChange={(e) => onChange?.({ target: { value: normalizeNumber(e.target.value, { decimal }) } })}
    />
  );
}
