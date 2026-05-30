const { withAndroidManifest } = require('@expo/config-plugins');

function withCleartextTraffic(config) {
  return withAndroidManifest(config, (mod) => {
    const app = mod.modResults.manifest.application[0];
    app.$['android:usesCleartextTraffic'] = 'true';
    return mod;
  });
}

module.exports = withCleartextTraffic;
