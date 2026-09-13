/**
 * Cross-module background work — and there is none yet.
 *
 * <p>A job belongs to the module whose service it calls, beside that module's
 * controllers and listeners, the way a queue consumer is just another inbound
 * adapter. {@code modules/payment/jobs} captures payments;
 * {@code modules/fulfilment/jobs} unwinds abandoned picks. This package exists
 * for the case those cannot cover: a job that coordinates several modules and
 * belongs to none of them — a process manager, a saga. It reaches modules only
 * through {@code shared.contracts}, and it stays empty until such a job turns
 * up rather than collecting things that have a home.
 */
@org.springframework.modulith.ApplicationModule(
    id = "jobs",
    displayName = "Jobs",
    allowedDependencies = "shared :: *"
)
package com.minglemart.jobs;
