import { LANGS, useI18n } from '../i18n';
export function LangSwitch() {
  const { lang, setLang, t } = useI18n();
  return (
    <div className="lang" role="group" aria-label={t('language')}>
      {LANGS.map((l) => (
        <button key={l.code} type="button" aria-pressed={lang === l.code} onClick={() => setLang(l.code)} lang={l.code}>{l.label}</button>
      ))}
    </div>
  );
}
