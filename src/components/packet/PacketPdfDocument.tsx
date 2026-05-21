import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: "1px solid #000",
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  section: {
    marginBottom: 15,
  },
  label: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#666",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontSize: 12,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  col: {
    flex: 1,
  },
  status: {
    fontSize: 12,
    fontWeight: "bold",
    padding: "4 8",
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
});

interface PacketPdfProps {
  packet: {
    id: string;
    legacy_complaint_id?: string;
    address?: string;
    status?: string;
    hearing_date?: string;
    assigned_to?: string;
    created_at?: string;
  };
}

export function PacketPdfDocument({ packet }: PacketPdfProps) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Director's Hearing Packet</Text>
          <Text style={styles.subtitle}>
            San Francisco Department of Public Health
          </Text>
          <Text style={styles.subtitle}>Environmental Health Branch</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Packet ID</Text>
              <Text style={styles.value}>{packet.id}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Case Number</Text>
              <Text style={styles.value}>
                {packet.legacy_complaint_id || "N/A"}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Property Address</Text>
              <Text style={styles.value}>{packet.address || "N/A"}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Status</Text>
              <Text style={styles.status}>{packet.status || "N/A"}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Hearing Date</Text>
              <Text style={styles.value}>
                {packet.hearing_date
                  ? new Date(
                      packet.hearing_date + "T00:00:00",
                    ).toLocaleDateString()
                  : "Not scheduled"}
              </Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Assigned To</Text>
              <Text style={styles.value}>
                {packet.assigned_to || "Unassigned"}
              </Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Created</Text>
              <Text style={styles.value}>
                {packet.created_at
                  ? new Date(packet.created_at).toLocaleDateString()
                  : "N/A"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Document Notes</Text>
          <Text style={styles.value}>
            This packet contains all materials for the Director's Hearing
            proceedings. Please review all exhibits and chronology entries
            before the hearing date.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export function PacketDownloadLink({
  packet,
  children,
}: PacketPdfProps & { children: React.ReactNode }) {
  return (
    <PDFDownloadLink
      document={<PacketPdfDocument packet={packet} />}
      fileName={`hearing-packet-${packet.id}.pdf`}
    >
      {children}
    </PDFDownloadLink>
  );
}
