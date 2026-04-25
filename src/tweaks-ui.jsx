import { TweaksPanel, TweakSection, TweakRadio } from './tweaks-panel.jsx';

// Tweaks panel intentionally minimal — most controls are now in the UI.
function TweaksUI({ tw, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme" />
      <TweakRadio label="Preset" value={tw.preset || "dark-lime"}
            options={["dark-lime","light-magenta"]}
            onChange={(v) => setTweak("preset", v)} />

      <TweakSection label="Density" />
      <TweakRadio label="Spacing" value={tw.density}
            options={["compact","normal","spacious"]}
            onChange={(v) => setTweak("density", v)} />
    </TweaksPanel>
  );
}

export { TweaksUI };
