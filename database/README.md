## 🔄 End-to-End Broadcast Workflow

```
                    ┌──────────────┐
                    │    DONOR     │
                    └──────┬───────┘
                           │
                    Create Donation
                           │
                           ▼
                ┌─────────────────────┐
                │ Donation Available  │
                └──────────┬──────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
         NGO 1          NGO 2          NGO 3
        Can View        Can View       Can View
             │             │             │
             └─────────────┼─────────────┘
                           │
                    One NGO Accepts
                           │
                           ▼
                  ┌────────────────┐
                  │ NGO Accepted   │
                  └───────┬────────┘
                          │
                    Notify ALL
                    Volunteers
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        Volunteer 1  Volunteer 2  Volunteer 3
        Can Accept   Can Accept   Can Accept
             │            │            │
             └────────────┼────────────┘
                          │
                  First Volunteer
                     Accepts
                          │
                          ▼
                ┌──────────────────┐
                │ Volunteer        │
                │ Assigned         │
                └────────┬─────────┘
                         │
                       Pickup
                         │
                         ▼
                    Delivery
                         │
                         ▼
                    NGO receives
                         │
                         ▼
                   Beneficiaries
        ┌────────────────────────────────────┐
        │              ADMIN                 │
        │                                    │
        │ Monitor all activities             │
        │ Donors / NGOs / Volunteers         │
        │ Donations / Requests / Assignments │
        │ Live volunteer location            │
        │ Delivery status                    │
        │ Reports / Analytics / Logs         │
        └────────────────────────────────────┘
```
