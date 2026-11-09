import LoadingRing from "./components/LoadingRing";
import "./styles/RouteLoadingOverlay.css";

export default function Loading() {
  return <div className="shop-loading-screen" role="status" aria-live="polite"><div className="rlo-stack"><LoadingRing active /><p>Loading page...</p></div></div>;
}
