import { type FC } from 'react';

import {
    InvoicesSection,
    PaymentMethodsSection,
} from '../components/commerce-sections';
import { BILLING_SECTIONS } from '../components/section-index';
import { SettingsPage } from '../components/settings-page';

const Billing: FC = () => (
    <SettingsPage
        title="Payment"
        description="How you pay, and where your receipts go. Card details are held by our payment processor and never touch our servers."
        sections={BILLING_SECTIONS}
    >
        <PaymentMethodsSection />
        <InvoicesSection />
    </SettingsPage>
);

export default Billing;
