import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { Provenance } from "../components/Provenance";
import { PulseTabs } from "../components/PulseTabs";
import { useBusiness, useStreet } from "../data/api";

// design-unmet-v2/StreetMap.dc.html — real Leaflet + Esri dark gray tiles over
// business.geo coordinates, instead of the artboard's fixed pixel pins.
const SERPAPI_HQ = { lat: 30.3268, lng: -97.7226, label: "SERPAPI HQ · 5540 N LAMAR" };
const LABEL_ORDER = ["below", "above", "right", "left"] as const;
type LabelPos = (typeof LABEL_ORDER)[number];

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// Great-circle distance in miles.
function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function colorForHits(hitCount: number) {
  if (hitCount >= 5) return "#ff6b3d";
  if (hitCount === 4) return "#e0925a";
  return "#6f7a86";
}

// sqrt scale, clamped 14-36px.
function sizeForReviews(reviews: number) {
  return Math.max(14, Math.min(36, 14 + Math.sqrt(Math.max(0, reviews)) * 0.6));
}

export function StreetMap() {
  const business = useBusiness();
  const street = useStreet(business?._id);
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return;
    const map = L.map(mapElRef.current, { zoomControl: false }).setView([30.27, -97.74], 12);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !street || !street.business) return;
    layersRef.current.forEach((l) => l.remove());
    layersRef.current = [];

    const places = street.places.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    if (places.length === 0) return;

    const bounds = L.latLngBounds(places.map((p) => [p.lat, p.lng] as [number, number]));
    const isAustin = /austin/i.test(street.business.location ?? "");
    if (isAustin) bounds.extend([SERPAPI_HQ.lat, SERPAPI_HQ.lng]);
    // paddingTopLeft clears the 360px side panel + the 56px topbar.
    map.fitBounds(bounds, { padding: [60, 60], paddingTopLeft: [400, 80] });

    // ponytail: O(n²) label-collision pass, fine for the handful of pins one
    // run produces. Upgrade to a real layout solver if a business ever has
    // dozens of peers.
    const placed: { pt: L.Point; pos: LabelPos }[] = [];
    const mapWidth = map.getSize().x;
    const containerPts = new Map<string, L.Point>();
    const positions = new Map<string, LabelPos>();
    for (const p of places) {
      const cpt = map.latLngToContainerPoint([p.lat, p.lng]);
      containerPts.set(p.dataId, cpt);
      const near = new Set(placed.filter((o) => cpt.distanceTo(o.pt) < 90).map((o) => o.pos));
      const pos = LABEL_ORDER.find((o) => !near.has(o)) ?? "below";
      positions.set(p.dataId, pos);
      placed.push({ pt: cpt, pos });
    }

    for (const p of places) {
      const size = sizeForReviews(p.reviews ?? 0);
      const pos = positions.get(p.dataId) ?? "below";
      const dotHtml = p.isYou
        ? `<span class="sm-dot you" style="width:${size}px;height:${size}px;"></span>`
        : `<span class="sm-dot" style="width:${size}px;height:${size}px;background:${colorForHits(p.hitCount)};"></span>`;
      const ringsHtml = p.isYou ? `<span class="sm-ring a"></span><span class="sm-ring b"></span><span class="sm-ring c"></span>` : "";
      const labelHtml = `<span class="sm-pinlabel sm-pinlabel-${pos}${p.isYou ? " you" : ""}">${esc(p.title)}${p.isYou ? " · YOU" : ""}</span>`;
      const icon = L.divIcon({ html: `<div class="sm-pin">${ringsHtml}${dotHtml}${labelHtml}</div>`, className: "", iconSize: [0, 0], iconAnchor: [0, 0] });
      const marker = L.marker([p.lat, p.lng], { icon });

      const hitsHtml = p.hits.length ? `<div class="sm-card-hits">${p.hits.map((h) => `<span>${esc(h.label)}</span>`).join("")}</div>` : "";
      const quoteHtml = p.worstQuote ? `<q class="sm-card-quote">${esc(p.worstQuote.text)}</q>` : "";
      const srcHtml = p.worstQuote
        ? `<div class="sm-card-src"><b>${p.worstQuote.rating ?? "—"}★</b> ${esc((p.worstQuote.source ?? "").toUpperCase())} · THIS WEEK · ${p.hitCount} OF ${street.topGaps.length} TOP GAPS</div>`
        : `<div class="sm-card-src">${p.readThisWeek} read this week · ${p.hitCount} OF ${street.topGaps.length} TOP GAPS</div>`;
      const popupHtml = `<div class="sm-card-title"><span>${esc(p.title)}</span><small>${p.rating ?? "—"} · ${formatCount(p.reviews ?? 0)}</small></div>${hitsHtml}${quoteHtml}${srcHtml}`;
      // Open the popup on the side of the pin with more room so it never
      // covers a neighbour's label.
      const px = containerPts.get(p.dataId)?.x ?? 0;
      const offsetX = px < mapWidth / 2 ? 140 : -140;
      marker.bindPopup(popupHtml, { offset: L.point(offsetX, -10), autoPan: true, closeButton: true, className: "sm-popup" });
      marker.on("mouseover", () => marker.openPopup());
      marker.addTo(map);
      layersRef.current.push(marker);
    }

    if (isAustin) {
      const hqIcon = L.divIcon({
        html: `<div class="sm-hq"><i></i><span class="sm-hqlabel">${esc(SERPAPI_HQ.label)}</span></div>`,
        className: "",
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      const hqMarker = L.marker([SERPAPI_HQ.lat, SERPAPI_HQ.lng], { icon: hqIcon }).addTo(map);
      layersRef.current.push(hqMarker);

      const you = places.find((p) => p.isYou);
      if (you) {
        const miles = haversineMiles(you, SERPAPI_HQ);
        const line = L.polyline(
          [
            [you.lat, you.lng],
            [SERPAPI_HQ.lat, SERPAPI_HQ.lng],
          ],
          { color: "#3ddc84", weight: 1, dashArray: "4 6", opacity: 0.8 },
        ).addTo(map);
        line.bindTooltip(`${miles.toFixed(1)} MI`, { permanent: true, direction: "center", className: "sm-tie-label" });
        layersRef.current.push(line);
      }
    }
  }, [street]);

  // The map container below is always rendered (even while business/street
  // are still loading) so its ref is attached on first mount -- the effect
  // above that creates the Leaflet map only ever runs once, on mount.
  const loadingBusiness = business === undefined;
  const noBusiness = business === null;
  const loading = !loadingBusiness && !noBusiness && street === undefined;
  const empty = street !== undefined && street !== null && street.places.length === 0;

  return (
    <div className="root">
      <Topbar
        activeSeg="pulse"
        crumb={
          business ? (
            <>
              <span>{business.name}</span>
              <span style={{ color: "var(--dim)" }}>·</span>
              <span>{business.location}</span>
            </>
          ) : undefined
        }
      >
        <PulseTabs active="street" />
      </Topbar>

      <div className="mapstage">
        <div ref={mapElRef} className="sm-map" />
        <div className="sm-vignette" />

        <div className="sm-panel">
          <span className="lab">
            The street{business ? ` · ${business.category} · ${business.location}` : ""}
          </span>
          {loadingBusiness && (
            <>
              <div className="skel" style={{ height: 60 }} />
              <div className="skel" style={{ height: 120, animationDelay: "0.15s" }} />
            </>
          )}
          {noBusiness && <p>No business yet — run a Pulse first.</p>}
          {loading && (
            <>
              <div className="skel" style={{ height: 60 }} />
              <div className="skel" style={{ height: 120, animationDelay: "0.15s" }} />
            </>
          )}
          {empty && <p>This business was discovered before the map existed — run Pulse once to place it.</p>}
          {business && street && street.places.length > 0 && (
            <>
              <h1>{street.places.length} places, three platforms, one week.</h1>
              <p>Every pin is a place SerpApi found. Size is how many reviews it carries. Colour is how many of this week's top five gaps hit it.</p>
              <div className="sm-list">
                {street.places.map((p, i) => (
                  <div className={p.isYou ? "sm-row you" : "sm-row"} key={p.dataId}>
                    <span className="k">{String(i + 1).padStart(2, "0")}</span>
                    <span className="sm-nm">
                      {p.title}
                      {p.isYou ? " · you" : ""}
                    </span>
                    <span className="m">
                      {p.rating ?? "—"} · {formatCount(p.reviews ?? 0)}
                    </span>
                    <span className="pips">
                      {street.topGaps.map((g, gi) => (
                        <i key={gi} className={p.hits.some((h) => h.theme === g.theme) ? "on" : undefined} />
                      ))}
                    </span>
                  </div>
                ))}
              </div>
              <div className="sm-legend">
                <div>
                  <i style={{ background: "#ff6b3d" }} />
                  hit on all five top gaps
                </div>
                <div>
                  <i style={{ background: "#e0925a" }} />
                  four of five
                </div>
                <div>
                  <i style={{ background: "#6f7a86" }} />
                  three or fewer
                </div>
                <div>
                  <i style={{ background: "var(--ground)", border: "2px solid var(--orange)", width: 8, height: 8 }} />
                  you · rings = this week's pull
                </div>
                <div>
                  <i style={{ background: "var(--green)", borderRadius: 0 }} />
                  SerpApi HQ · the judges' desk
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <StatusBar
        items={[
          { content: <Provenance compact liveCalls={street?.run?.liveCalls} cachedCalls={street?.run?.cachedCalls} at={street?.run?.startedAt} /> },
          { content: <>COORDS <b>google_maps · gps_coordinates</b></> },
          { content: <>BASEMAP <b>ESRI DARK GRAY · NO KEY</b></> },
          {
            content: street ? (
              <>{street.places.length} PLACES · {street.run?.reviewCount ?? 0} REVIEWS</>
            ) : (
              "—"
            ),
            push: true,
          },
        ]}
      />
    </div>
  );
}
