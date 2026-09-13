import { type FC } from 'react';
import { useParams } from 'react-router-dom';

import { ShopView } from '@/common/components/shop/shop-view';

/**
 * Signed-in view of the same shop grid.
 *
 * Same component as `/shop`, given the customer's own path prefix so every
 * product link stays inside their section of the site.
 */
const CShop: FC = () => {
    const { publicUserId } = useParams();

    return <ShopView basePath={`/user/${publicUserId}`} />;
};

export default CShop;
