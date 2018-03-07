const tenantModelsProvider = require("../tenantModelsProvider");

interface ChargebeeCustomer {
    id: string;
    email: string;
}

interface ChargebeeSubscription {
    id: string;
    customer_id: string;
    plan_id: string;
    created_at: string;
    activated_at: string;
    status: string;
}

interface ChargebeeEventContent {
    id: string;
    subscription: ChargebeeSubscription;
    customer: ChargebeeCustomer;
}

interface ChargebeeEvent {
    content: ChargebeeEventContent;
    event_type: string;
}

const init = (app: any) => {
    /**
     * Those hooks need to be secured with basic authentification!
     * Example request:
     * {
            "id": "ev_2smoc99sQkEif5cbM3",
            "occurred_at": 1519165748,
            "source": "admin_console",
            "user": "adrian@vq-labs.com",
            "object": "event",
            "api_version": "v2",
            "content": {
                "subscription": {
                    "id": "2smoc99sQkEif3gbLy",
                    "customer_id": "B4bhYdQjZWfD5M3Z",
                    "plan_id": "starter",
                    "plan_quantity": 1,
                    "plan_unit_price": 0,
                    "billing_period": 1,
                    "billing_period_unit": "month",
                    "plan_free_quantity": 0,
                    "status": "active",
                    "current_term_start": 1519165748,
                    "current_term_end": 1521584948,
                    "next_billing_at": 1521584948,
                    "created_at": 1519165748,
                    "started_at": 1519165748,
                    "activated_at": 1519165748,
                    "updated_at": 1519165748,
                    "has_scheduled_changes": false,
                    "resource_version": 1519165748526,
                    "deleted": false,
                    "object": "subscription",
                    "currency_code": "EUR",
                    "due_invoices_count": 0,
                    "mrr": 0
                },
                "customer": {
                    "id": "B4bhYdQjZWfD5M3Z",
                    "first_name": "Adrian",
                    "last_name": "Barwicki",
                    "email": "adrian+rentals@vq-labs.com",
                    "auto_collection": "on",
                    "net_term_days": 0,
                    "allow_direct_debit": false,
                    "created_at": 1518557059,
                    "taxability": "taxable",
                    "updated_at": 1519165586,
                    "locale": "en-GB",
                    "resource_version": 1519165586847,
                    "deleted": false,
                    "object": "customer",
                    "card_status": "valid",
                    "primary_payment_source_id": "pm_1mk51UzQkEhz1dbZZ",
                    "payment_method": {
                        "object": "payment_method",
                        "type": "card",
                        "reference_id": "cus_CMSUTx3xrQNCTn/card_1BxjZ5JzBaRgxnTAyY3AIW5F",
                        "gateway": "stripe",
                        "gateway_account_id": "gw_1mkVvwZQYP8JAn2Td1",
                        "status": "valid"
                    },
                    "promotional_credits": 0,
                    "refundable_credits": 0,
                    "excess_payments": 0,
                    "unbilled_charges": 0,
                    "preferred_currency_code": "EUR",
                    "meta_data": {
                        "tenantId": "rentkitchen",
                        "marketplaceUrl": "https://rentkitchen.vqmarketplace.com",
                        "marketplaceType": "services",
                        "country": "DE"
                    }
                },
                "card": {
                    "status": "valid",
                    "gateway": "stripe",
                    "gateway_account_id": "gw_1mkVvwZQYP8JAn2Td1",
                    "first_name": "Adrian",
                    "last_name": "Barwicki",
                    "iin": "538734",
                    "last4": "0549",
                    "card_type": "mastercard",
                    "funding_type": "credit",
                    "expiry_month": 1,
                    "expiry_year": 2021,
                    "issuing_country": "DE",
                    "billing_country": "DE",
                    "ip_address": "172.58.91.136",
                    "object": "card",
                    "masked_number": "************0549",
                    "customer_id": "B4bhYdQjZWfD5M3Z",
                    "payment_source_id": "pm_1mk51UzQkEhz1dbZZ"
                },
                "invoice": {
                    "id": "1",
                    "customer_id": "B4bhYdQjZWfD5M3Z",
                    "subscription_id": "2smoc99sQkEif3gbLy",
                    "recurring": true,
                    "status": "paid",
                    "price_type": "tax_exclusive",
                    "date": 1519165748,
                    "due_date": 1519165748,
                    "net_term_days": 0,
                    "exchange_rate": 1.0,
                    "total": 0,
                    "amount_paid": 0,
                    "amount_adjusted": 0,
                    "write_off_amount": 0,
                    "credits_applied": 0,
                    "amount_due": 0,
                    "paid_at": 1519165748,
                    "updated_at": 1519165748,
                    "resource_version": 1519165748515,
                    "deleted": false,
                    "object": "invoice",
                    "first_invoice": true,
                    "amount_to_collect": 0,
                    "round_off_amount": 0,
                    "new_sales_amount": 0,
                    "has_advance_charges": false,
                    "currency_code": "EUR",
                    "base_currency_code": "EUR",
                    "tax": 0,
                    "line_items": [{
                        "id": "li_2smoc99sQkEif48bM0",
                        "date_from": 1519165748,
                        "date_to": 1521584948,
                        "unit_amount": 0,
                        "quantity": 1,
                        "is_taxed": false,
                        "tax_amount": 0,
                        "object": "line_item",
                        "subscription_id": "2smoc99sQkEif3gbLy",
                        "amount": 0,
                        "description": "Starter",
                        "entity_type": "plan",
                        "entity_id": "starter",
                        "tax_exempt_reason": "tax_not_configured",
                        "discount_amount": 0,
                        "item_level_discount_amount": 0
                    }],
                    "sub_total": 0,
                    "linked_payments": [],
                    "applied_credits": [],
                    "adjustment_credit_notes": [],
                    "issued_credit_notes": [],
                    "linked_orders": [],
                    "billing_address": {
                        "first_name": "Adrian",
                        "last_name": "Barwicki",
                        "validation_status": "not_validated",
                        "object": "billing_address"
                    }
                }
            },
            "event_type": "subscription_created",
            "webhook_status": "not_configured"
        }
     */
    
    const getTenantForChargebeeEvent = (req: any, res: any, next: any) => {
        const chargebeeEvent: ChargebeeEvent = req.body;
        const tenantEmail = chargebeeEvent.content.customer.email;

        tenantModelsProvider
        .getTenant({
            email: tenantEmail
        }, (err: any, tenantRef: any, tenantModels: any) => {
                if (err) {
                    return res.status(400).send(err);
                }

                req.tenantModels = tenantModels;
                req.tenantRef = tenantRef;

                return next();
            });
    };

    app.post("/api/hooks/tenant/subscription", getTenantForChargebeeEvent, (req: any, res: any) => {
        const chargebeeEvent: ChargebeeEvent = req.body;
        const tenantRef = req.tenantRef;

        if ([
            "subscription_created",
            "subscription_cancelled",
            "subscription_changed"
        ].indexOf(chargebeeEvent.event_type) === -1) {
            return res.send({ ok: true, desc: "This webhook has not been implemented." })
        }

        // chargebee customer ID update (in case not present)
        tenantRef.chargebeeCustomerId = chargebeeEvent.content.subscription.customer_id;

        /**
         * Subscription created - we update tenant plan giving him new rights for use of the software
         */
        if (chargebeeEvent.event_type === "subscription_created") {
            tenantRef.chargebeeSubscriptionId = chargebeeEvent.content.subscription.id;

            if (chargebeeEvent.content.subscription.status === "active") {
                tenantRef.activePlan = chargebeeEvent.content.subscription.plan_id;
            }
        }

        /**
         * Subscription cancelled - we update tenant plan stripping him from rights for use of the software or degrading him to the lowest sub. level.
         */
        if (chargebeeEvent.event_type === "subscription_cancelled") {
            tenantRef.chargebeeSubscriptionId = undefined;

            tenantRef.activePlan = "starter";
        }

         /**
         * Subscription changed - we update tenant plan.
         */
        if (chargebeeEvent.event_type === "subscription_changed") {
            tenantRef.chargebeeSubscriptionId = chargebeeEvent.content.subscription.id;

            if (chargebeeEvent.content.subscription.status === "active") {
                tenantRef.activePlan = chargebeeEvent.content.subscription.plan_id;
            }
        }


        return tenantRef
                .save()
                .then(() => res.send({
                    ok: true
                }))
                .catch((err: any)=> res.send(err));
    });
};

module.exports = {
    init
};
