import { useEffect } from 'react';
import type { MatchDetails, OverlaySetup } from '../types';
import staticBadges from '../shared/utils/badges';

function preload(urls: string[]): void {
  urls.filter(Boolean).forEach(url => { new Image().src = url; });
}

/** Warms the browser image cache so panels and previews find images
 *  already cached when they mount.
 *
 *  - Badge catalogue: preloaded once at mount (118 static images).
 *  - Team logos / competition logo: re-preloaded when matchDetails changes.
 *  - Sponsor images / social icons: re-preloaded when overlaySetup changes.
 */
export function useImagePreloader(matchDetails: MatchDetails, overlaySetup: OverlaySetup): void {
  // Badge catalogue — static list, load once in the background after mount.
  useEffect(() => {
    preload(staticBadges.map(b => b.url));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    preload([matchDetails.teamLogos.teamA, matchDetails.teamLogos.teamB, matchDetails.competitionLogo]);
  }, [matchDetails.teamLogos.teamA, matchDetails.teamLogos.teamB, matchDetails.competitionLogo]);

  useEffect(() => {
    preload([
      ...overlaySetup.sponsors.imageUrls,
      ...overlaySetup.socialMedia.channels.map(ch => ch.icon),
    ]);
  }, [overlaySetup.sponsors.imageUrls, overlaySetup.socialMedia.channels]);
}
