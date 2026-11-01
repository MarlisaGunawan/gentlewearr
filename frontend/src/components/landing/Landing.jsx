import { editorial, essentials, featuredPanel, lookbook, shopRow } from '../../config/landingContent';
import CollectionPanel from './CollectionPanel';
import EditorialFeature from './EditorialFeature';
import Lookbook from './Lookbook';
import ShopRow from './ShopRow';

// Everything between the hero and the footer. Each `id` is a navbar target.
export default function Landing() {
  return (
    <main className="landing">
      <CollectionPanel id="collection" panel={featuredPanel} showNav />
      <ShopRow id="essentials" products={shopRow} title={essentials.title} />
      <EditorialFeature id="story" story={editorial} />
      <Lookbook id="lookbook" content={lookbook} />
    </main>
  );
}
