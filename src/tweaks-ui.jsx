/* global React */

// Tweaks panel intentionally minimal — most controls are now in the UI.
function TweaksUI({ tw, setTweak }) {
  const TP = window.TweaksPanel;
  const TSec = window.TweakSection;
  const TRad = window.TweakRadio;

  return (
    <TP title="Tweaks">
      <TSec label="Theme" />
      <TRad label="Preset" value={tw.preset || "dark-lime"}
            options={["dark-lime","light-magenta"]}
            onChange={(v) => setTweak("preset", v)} />

      <TSec label="Density" />
      <TRad label="Spacing" value={tw.density}
            options={["compact","normal","spacious"]}
            onChange={(v) => setTweak("density", v)} />
    </TP>
  );
}

window.TweaksUI = TweaksUI;
