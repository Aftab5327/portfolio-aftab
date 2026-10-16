/**
 * ATS-friendly PDF resume (A4, single column, real text, standard headings,
 * clickable links, no tables or images). Rendered at build time by
 * app/resume.pdf/route.ts.
 */
import path from "node:path";
import { Document, Font, Link, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { certificationMeta, educationLine, experienceMeta, formatDate, type Resume } from "@/lib/resume";

const FONT_DIR = path.join(process.cwd(), "assets", "fonts");
let fontsRegistered = false;

function registerFonts() {
  if (fontsRegistered) return;
  // Bundled locally (assets/fonts, SIL OFL) so the build never fetches fonts.
  Font.register({
    family: "Inter",
    fonts: [
      { src: path.join(FONT_DIR, "Inter-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "Inter-SemiBold.ttf"), fontWeight: 600 },
      { src: path.join(FONT_DIR, "Inter-Bold.ttf"), fontWeight: 700 }
    ]
  });
  // No automatic hyphenation: split words confuse ATS keyword matching.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

const ACCENT = "#0a7166";
/** Non-breaking spaces: react-pdf trims ordinary leading spaces at the start of each text box. */
const SEPARATOR = "\u00A0\u00A0|\u00A0\u00A0";
const MUTED = "#4a5a52";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9.5,
    lineHeight: 1.4,
    color: "#111111",
    paddingTop: 36,
    paddingBottom: 44,
    paddingHorizontal: 42
  },
  name: { fontSize: 20, fontWeight: 700, lineHeight: 1.15 },
  title: { fontSize: 11, fontWeight: 600, color: ACCENT, marginTop: 2 },
  contact: { marginTop: 6, fontSize: 8.75, color: MUTED, flexDirection: "row", flexWrap: "wrap" },
  link: { color: ACCENT, textDecoration: "none" },
  section: { marginTop: 11 },
  heading: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: ACCENT,
    paddingBottom: 2,
    marginBottom: 5,
    borderBottomWidth: 0.75,
    borderBottomColor: "#cfd8d3"
  },
  item: { marginBottom: 6 },
  itemTitle: { fontWeight: 600 },
  meta: { fontSize: 8.5, color: MUTED },
  bullet: { flexDirection: "row", marginTop: 1.5 },
  bulletMark: { width: 10, color: ACCENT },
  bulletText: { flex: 1 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 42,
    right: 42,
    textAlign: "center",
    fontSize: 7.5,
    color: "#7a8a83"
  }
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      {/* minPresenceAhead keeps a heading from being stranded at the bottom of a page. */}
      <Text style={styles.heading} minPresenceAhead={40}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletMark}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

/**
 * Items separated by " | ", each its own text box in a wrapping row, so lines
 * break between items (one long paragraph made react-pdf hyphenate at the wrap).
 */
function InlineRow({ items }: { items: React.ReactNode[] }) {
  return (
    <View style={styles.contact}>
      {items.map((item, index) => (
        <Text key={index}>
          {index > 0 ? SEPARATOR : ""}
          {item}
        </Text>
      ))}
    </View>
  );
}

function ResumeDocument({ resume }: { resume: Resume }) {
  const { contact } = resume;
  const contactItems: React.ReactNode[] = [
    <Link key="email" src={`mailto:${contact.email}`} style={styles.link}>
      {contact.email}
    </Link>,
    ...(contact.phone ? [contact.phone] : []),
    contact.location,
    ...contact.links.map((item) => (
      <Link key={item.url} src={item.url} style={styles.link}>
        {item.label}
      </Link>
    ))
  ];

  const footer = [
    `Generated from ${resume.name.split(" ")[0]}'s portfolio on ${formatDate(resume.meta.generatedAt)}`,
    resume.meta.siteUrl
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Document
      title={`${resume.name} – Resume`}
      author={resume.name}
      subject={`${resume.title} resume`}
      keywords={resume.skills.flatMap((group) => group.items).join(", ")}
      creator={resume.meta.siteUrl || resume.name}
      producer="@react-pdf/renderer"
      language="en"
    >
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.name}>{resume.name}</Text>
          <Text style={styles.title}>{resume.title}</Text>
          <InlineRow items={contactItems} />
        </View>

        {resume.summary ? (
          <Section title="Summary">
            <Text>{resume.summary}</Text>
          </Section>
        ) : null}

        {resume.experience.length ? (
          <Section title="Experience">
            {resume.experience.map((item) => (
              <View key={`${item.company}-${item.role}-${item.start}`} style={styles.item} wrap={false}>
                <Text style={styles.itemTitle}>
                  {item.role} — {item.company}
                </Text>
                <Text style={styles.meta}>{experienceMeta(item)}</Text>
                {item.summary ? <Text style={{ marginTop: 2 }}>{item.summary}</Text> : null}
                {item.highlights.map((highlight) => (
                  <Bullet key={highlight}>{highlight}</Bullet>
                ))}
              </View>
            ))}
          </Section>
        ) : null}

        {resume.projects.length ? (
          <Section title="Projects">
            {resume.projects.map((project) => (
              <View key={project.title} style={styles.item} wrap={false}>
                <Text>
                  <Text style={styles.itemTitle}>{project.title}</Text>
                  {project.tagline ? ` — ${project.tagline}` : ""}
                </Text>
                {project.bullet ? <Bullet>{project.bullet}</Bullet> : null}
                <View style={[styles.meta, { flexDirection: "row", flexWrap: "wrap" }]}>
                  {project.stack.length ? <Text>Stack: {project.stack.join(", ")}</Text> : null}
                  {project.link.url ? (
                    <Text>
                      {project.stack.length ? SEPARATOR : ""}
                      <Link src={project.link.url} style={styles.link}>
                        {project.link.label}
                      </Link>
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}
          </Section>
        ) : null}

        {resume.skills.length ? (
          <Section title="Skills">
            {resume.skills.map((group) => (
              <Text key={group.category} style={{ marginBottom: 2 }}>
                <Text style={styles.itemTitle}>{group.category}: </Text>
                {group.items.join(", ")}
              </Text>
            ))}
          </Section>
        ) : null}

        {resume.education.length ? (
          <Section title="Education">
            {resume.education.map((item) => (
              <Text key={educationLine(item)} style={{ marginBottom: 2 }}>
                {educationLine(item)}
              </Text>
            ))}
          </Section>
        ) : null}

        {resume.certifications.length ? (
          <Section title="Certifications">
            {resume.certifications.map((cert) => (
              <Text key={`${cert.issuer}-${cert.name}`} style={{ marginBottom: 2 }}>
                {cert.url ? (
                  <Link src={cert.url} style={styles.link}>
                    {cert.name}
                  </Link>
                ) : (
                  cert.name
                )}
                {` — ${certificationMeta(cert)}`}
              </Text>
            ))}
          </Section>
        ) : null}

        {resume.extraSections.map((section) => (
          <Section key={section.title} title={section.title}>
            {section.items.map((item) => (
              <Bullet key={item}>{item}</Bullet>
            ))}
          </Section>
        ))}

        <Text style={styles.footer} fixed>
          {footer}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderResumePdf(resume: Resume): Promise<Buffer> {
  registerFonts();
  return renderToBuffer(<ResumeDocument resume={resume} />);
}
