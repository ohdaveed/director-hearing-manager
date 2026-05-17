/**
 * getInspectorAlerts.ts
 *
 * Powers the two alert cards on the Inspector Dashboard:
 *
 *   1. New Assignments — complaints where dateAssigned is after the inspector's
 *      last recorded login timestamp (stored in Users.lastLogin).
 *
 *   2. No Contact Attempt — complaints in "Contact Pending" status that have
 *      zero Chronology entries of type "Contact Attempt".
 *
 * Side effect: after reading lastLogin, this endpoint updates it to the current
 * time (fire-and-forget) so the next load correctly shows only "since this session".
 *
 * Called by: InspectorDashboardPage on every dashboard load.
 */

import { z } from 'zod';
import { createEndpoint, ArrizonOpenComplaintInspectionsList1, Chronology, Users } from 'zite-integrations-backend-sdk';

const complaintSchema = z.object({
  id: z.string(),
  complaintId: z.string().optional(),
  address: z.string().optional(),
  status: z.string().optional(),
  dateAssigned: z.string().optional(),
  dateEntered: z.string().optional(),
});

export default createEndpoint({
  description: 'Get inspector dashboard alerts: new assignments since last login and contact-pending complaints with no contact attempt',
  inputSchema: z.object({
    inspectorName: z.string(),
  }),
  outputSchema: z.object({
    newAssignments: z.array(complaintSchema),
    noContactAttempt: z.array(complaintSchema),
    previousLastLogin: z.string().optional(),
  }),
  execute: async ({ input, context }) => {
    const userId = context.user.id;

    // 1. Read the user record to get their previous last login
    const userRecord = await Users.findOne({ id: userId, fields: ['lastLogin'] });
    const previousLastLogin = userRecord?.lastLogin;

    // 2. Fetch all assigned complaints in parallel with contact-pending complaints
    const [allAssignedResult, contactPendingResult] = await Promise.all([
      ArrizonOpenComplaintInspectionsList1.findAll({
        filters: { assignedTo: input.inspectorName },
        limit: 200,
        fields: ['id', 'complaintId', 'address', 'status', 'dateAssigned', 'dateEntered', 'deletedAt'],
      }),
      ArrizonOpenComplaintInspectionsList1.findAll({
        filters: { assignedTo: input.inspectorName, status: 'Contact Pending' },
        limit: 200,
        fields: ['id', 'complaintId', 'address', 'status', 'dateAssigned', 'dateEntered', 'deletedAt'],
      }),
    ]);

    // 3. Update last login to now (fire-and-forget style — don't await to keep response fast)
    Users.update({ id: userId, record: { lastLogin: new Date().toISOString() } }).catch(() => {});

    // 4. Compute new assignments: complaints where dateAssigned > previousLastLogin
    let newAssignments: typeof allAssignedResult.records = [];
    if (previousLastLogin) {
      const lastLoginDate = new Date(previousLastLogin);
      newAssignments = allAssignedResult.records.filter((c) => {
        if (c.deletedAt) return false;
        if (!c.dateAssigned) return false;
        // dateAssigned is YYYY-MM-DD — compare date-only by parsing as local noon
        const assignedDate = new Date(c.dateAssigned + 'T12:00:00');
        return assignedDate > lastLoginDate;
      });
    }
    // If no previous login recorded, show nothing (first-time user, can't know what's "new")

    // 5. For contact-pending complaints, find which ones have zero Contact Attempt chronology entries
    const contactPending = contactPendingResult.records.filter((c) => !c.deletedAt);

    let noContactAttempt: typeof contactPending = [];
    if (contactPending.length > 0) {
      // Fetch all Contact Attempt chronology entries for these complaints in one call
      // We check complaint IDs (record IDs) against chronology entries
      const contactPendingIds = new Set(contactPending.map((c) => c.id));

      const { records: contactAttemptEntries } = await Chronology.findAll({
        filters: { entryType: 'Contact Attempt' },
        limit: 500,
        fields: ['id', 'complaint', 'entryType'],
      });

      // Build a set of complaint record IDs that already have a contact attempt
      const hasContactAttempt = new Set<string>();
      for (const entry of contactAttemptEntries) {
        const linkedId = typeof entry.complaint === 'string'
          ? entry.complaint
          : (entry.complaint as string[] | undefined)?.[0];
        if (linkedId && contactPendingIds.has(linkedId)) {
          hasContactAttempt.add(linkedId);
        }
      }

      noContactAttempt = contactPending.filter((c) => !hasContactAttempt.has(c.id));
    }

    return {
      newAssignments: newAssignments.map((c) => ({
        id: c.id,
        complaintId: c.complaintId,
        address: c.address,
        status: c.status,
        dateAssigned: c.dateAssigned,
        dateEntered: c.dateEntered,
      })),
      noContactAttempt: noContactAttempt.map((c) => ({
        id: c.id,
        complaintId: c.complaintId,
        address: c.address,
        status: c.status,
        dateAssigned: c.dateAssigned,
        dateEntered: c.dateEntered,
      })),
      previousLastLogin,
    };
  },
});
