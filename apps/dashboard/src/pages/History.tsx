import { useState } from 'react'
import { Container, Heading, Text, Flex, Grid, Card, Button, Badge, Table, Box, Separator } from '@radix-ui/themes'
import { ArrowLeftIcon, ClockIcon, CheckCircledIcon, CrossCircledIcon, StarIcon } from '@radix-ui/react-icons'

interface MockSession {
  id: string
  targetRole: string
  date: string
  status: 'completed' | 'abandoned'
  preConfidence: number
  postConfidence: number
  overallScore: number | null
  responseMode: 'voice' | 'text'
  questions: {
    questionText: string
    answerText: string
    durationSeconds?: number
    feedback: {
      structureScore: number
      relevanceScore: number
      brevityScore: number
      overallScore: number
      feedbackText: string
      highlightsRambling: string
      whatYouCouldHaveSaid: string
    }
  }[]
}

const MOCK_HISTORY: MockSession[] = [
  {
    id: 'session-1',
    targetRole: 'Software Engineer',
    date: '05 Jul 2026',
    status: 'completed',
    preConfidence: 3,
    postConfidence: 5,
    overallScore: 85,
    responseMode: 'voice',
    questions: [
      {
        questionText: 'Ceritakan tentang proyek tersulit yang pernah Anda kerjakan dan bagaimana Anda menyelesaikannya.',
        answerText: 'Di proyek terakhir saya di kampus, kami membuat sistem pemrosesan gambar. Kami mengalami kendala memori karena ukuran gambar terlalu besar sehingga server sering crash. Kemudian kami berdiskusi dengan tim, sempat bingung juga tapi akhirnya kami membagi prosesnya menjadi bagian-bagian kecil (chunking) dan mengoptimalkan garbage collection.',
        durationSeconds: 45,
        feedback: {
          structureScore: 88,
          relevanceScore: 90,
          brevityScore: 75,
          overallScore: 85,
          feedbackText: 'Penggunaan metode STAR sudah terlihat dengan baik pada penjelasan situasi dan solusi. Namun, bagian aksi (tindakan nyata Anda) masih bisa diuraikan secara lebih teratur tanpa menceritakan kebingungan tim secara berlebihan.',
          highlightsRambling: 'sempat bingung juga tapi akhirnya kami membagi...',
          whatYouCouldHaveSaid: 'Saya mendiagnosis kebocoran memori pada pengolahan gambar resolusi tinggi. Untuk mengatasinya, saya mengimplementasikan pemrosesan berbasis chunk (aliran data bertahap) dan mengurangi alokasi objek yang tidak perlu di memori heap.'
        }
      },
      {
        questionText: 'Bagaimana Anda menghadapi konflik pendapat di dalam tim teknis?',
        answerText: 'Saya biasanya mendengarkan dulu apa argumen rekan kerja tersebut. Setelah itu, kami membandingkan solusi berdasarkan data benchmark performa, bukan ego pribadi.',
        durationSeconds: 30,
        feedback: {
          structureScore: 82,
          relevanceScore: 85,
          brevityScore: 90,
          overallScore: 86,
          feedbackText: 'Jawaban yang ringkas dan langsung ke inti permasalahan. Struktur STAR dapat ditingkatkan lagi dengan menceritakan contoh kasus nyata secara singkat.',
          highlightsRambling: '',
          whatYouCouldHaveSaid: 'Saat ada perbedaan arsitektur database, saya mengusulkan pembuatan prototype sederhana dan melakukan benchmark performa read/write. Hasil benchmark tersebut kami gunakan untuk mengambil keputusan objektif.'
        }
      }
    ]
  },
  {
    id: 'session-2',
    targetRole: 'Product Manager',
    date: '02 Jul 2026',
    status: 'completed',
    preConfidence: 2,
    postConfidence: 4,
    overallScore: 76,
    responseMode: 'text',
    questions: [
      {
        questionText: 'Bagaimana Anda memprioritaskan fitur produk ketika semua pemangku kepentingan (stakeholder) merasa fitur mereka paling mendesak?',
        answerText: 'Saya menggunakan kerangka kerja RICE (Reach, Impact, Confidence, Effort) untuk menghitung nilai prioritas secara kuantitatif lalu mendiskusikannya kembali.',
        feedback: {
          structureScore: 75,
          relevanceScore: 80,
          brevityScore: 85,
          overallScore: 78,
          feedbackText: 'Konsep RICE adalah pilihan tepat. Tambahkan contoh bagaimana Anda menyelaraskan ekspektasi stakeholder setelah skor RICE didapatkan.',
          highlightsRambling: '',
          whatYouCouldHaveSaid: 'Saya membuat matriks prioritas menggunakan skor RICE. Setelah data kuantitatif terkumpul, saya mengadakan rapat sinkronisasi untuk mempresentasikan transparansi keputusan berdasarkan metrik bisnis utama.'
        }
      }
    ]
  },
  {
    id: 'session-3',
    targetRole: 'Frontend Engineer',
    date: '28 Jun 2026',
    status: 'abandoned',
    preConfidence: 3,
    postConfidence: 3,
    overallScore: null,
    responseMode: 'voice',
    questions: []
  }
]

export default function History() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  const selectedSession = MOCK_HISTORY.find(s => s.id === selectedSessionId)

  return (
    <Container size="3" style={{ padding: '40px 24px' }}>
      <Flex direction="column" gap="5">
        {/* Header */}
        {!selectedSession ? (
          <Box>
            <Heading size="6" mb="1">Riwayat & Evaluasi</Heading>
            <Text size="2" color="gray">
              Tinjau riwayat latihan wawancara Anda dan baca umpan balik mendalam dari AI.
            </Text>
          </Box>
        ) : (
          <Flex align="center" gap="3">
            <Button variant="ghost" onClick={() => setSelectedSessionId(null)}>
              <ArrowLeftIcon width="18" height="18" /> Kembali
            </Button>
            <Box>
              <Heading size="5">{selectedSession.targetRole}</Heading>
              <Text size="1" color="gray">{selectedSession.date} • Mode {selectedSession.responseMode === 'voice' ? 'Suara' : 'Teks'}</Text>
            </Box>
          </Flex>
        )}

        <Separator size="4" />

        {/* Conditional Rendering: List View vs Detail View */}
        {!selectedSession ? (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <Table.Root variant="surface">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Target Peran</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Tanggal</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Kepercayaan Diri</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Skor Rata-rata AI</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {MOCK_HISTORY.map((session) => (
                  <Table.Row key={session.id}>
                    <Table.RowHeaderCell>{session.targetRole}</Table.RowHeaderCell>
                    <Table.Cell>{session.date}</Table.Cell>
                    <Table.Cell>
                      {session.status === 'completed' ? (
                        <Badge color="green" variant="soft">
                          <CheckCircledIcon style={{ marginRight: '4px' }} /> Selesai
                        </Badge>
                      ) : (
                        <Badge color="red" variant="soft">
                          <CrossCircledIcon style={{ marginRight: '4px' }} /> Ditinggalkan
                        </Badge>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {session.preConfidence} → {session.postConfidence} / 5
                    </Table.Cell>
                    <Table.Cell>
                      {session.overallScore !== null ? (
                        <strong>{session.overallScore} / 100</strong>
                      ) : (
                        <Text color="gray">--</Text>
                      )}
                    </Table.Cell>
                    <Table.Cell style={{ textAlign: 'right' }}>
                      <Button
                        size="1"
                        variant="soft"
                        disabled={session.status === 'abandoned'}
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        Detail Feedback
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card>
        ) : (
          <Flex direction="column" gap="5">
            {/* Session Stats Banner */}
            <Card style={{ background: 'var(--gray-2)' }}>
              <Grid columns={{ initial: '1', md: '3' }} gap="4">
                <Box>
                  <Text size="1" color="gray" weight="bold">Skor Rata-rata AI</Text>
                  <Heading size="5">{selectedSession.overallScore} / 100</Heading>
                </Box>
                <Box>
                  <Text size="1" color="gray" weight="bold">Metrik Kepercayaan Diri</Text>
                  <Text size="2" as="div" style={{ marginTop: '4px' }}>
                    Sebelum: <strong>{selectedSession.preConfidence}/5</strong> • Sesudah: <strong>{selectedSession.postConfidence}/5</strong>
                  </Text>
                </Box>
                <Box>
                  <Text size="1" color="gray" weight="bold">Total Pertanyaan</Text>
                  <Text size="2" as="div" style={{ marginTop: '4px' }}>
                    <strong>{selectedSession.questions.length} Pertanyaan Selesai</strong>
                  </Text>
                </Box>
              </Grid>
            </Card>

            {/* Questions & AI Feedbacks */}
            <Heading size="4">Daftar Tanya Jawab & Evaluasi</Heading>
            <Flex direction="column" gap="4">
              {selectedSession.questions.map((q, idx) => (
                <Card key={idx} size="2">
                  <Flex direction="column" gap="3">
                    {/* Question Header */}
                    <Box>
                      <Badge color="blue" mb="1">Pertanyaan {idx + 1}</Badge>
                      <Heading size="3">{q.questionText}</Heading>
                    </Box>

                    <Separator size="4" />

                    {/* User Answer */}
                    <Box>
                      <Text size="2" weight="bold" color="gray" as="div" mb="1">Jawaban Anda:</Text>
                      <Card variant="surface" style={{ background: 'var(--gray-1)' }}>
                        <Text size="2" style={{ fontStyle: 'italic' }}>"{q.answerText}"</Text>
                      </Card>
                      {q.durationSeconds && (
                        <Text size="1" color="gray" style={{ marginTop: '6px', display: 'block' }}>
                          <ClockIcon style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Durasi Rekaman: {q.durationSeconds} detik
                        </Text>
                      )}
                    </Box>

                    <Separator size="4" />

                    {/* AI Feedback */}
                    <Box>
                      <Text size="2" weight="bold" as="div" mb="2">
                        <StarIcon style={{ marginRight: '6px', verticalAlign: 'middle' }} /> Evaluasi AI (Skor: {q.feedback.overallScore}/100)
                      </Text>

                      <Grid columns={{ initial: '1', md: '3' }} gap="2" mb="3">
                        <Card size="1">
                          <Text size="1" color="gray" as="div">Struktur (STAR)</Text>
                          <Text size="2" weight="bold" color="green">{q.feedback.structureScore}%</Text>
                        </Card>
                        <Card size="1">
                          <Text size="1" color="gray" as="div">Relevansi</Text>
                          <Text size="2" weight="bold" color="green">{q.feedback.relevanceScore}%</Text>
                        </Card>
                        <Card size="1">
                          <Text size="1" color="gray" as="div">Kepadatan (Brevity)</Text>
                          <Text size="2" weight="bold" color="amber">{q.feedback.brevityScore}%</Text>
                        </Card>
                      </Grid>

                      <Flex direction="column" gap="2">
                        <Box>
                          <Text size="2" weight="bold">Ulasan AI:</Text>
                          <Text size="2" color="gray" as="div">{q.feedback.feedbackText}</Text>
                        </Box>

                        {q.feedback.highlightsRambling && (
                          <Box style={{ background: 'var(--red-2)', padding: '10px', borderRadius: '6px' }}>
                            <Text size="2" weight="bold" color="red">Bagian Bertele-tele yang Disorot:</Text>
                            <Text size="2" color="red" style={{ textDecoration: 'line-through' }} as="div">
                              "{q.feedback.highlightsRambling}"
                            </Text>
                          </Box>
                        )}

                        <Box style={{ background: 'var(--green-2)', padding: '10px', borderRadius: '6px' }}>
                          <Text size="2" weight="bold" color="green">Saran Jawaban Lebih Baik (What You Could Have Said):</Text>
                          <Text size="2" color="green" as="div" style={{ fontWeight: '500' }}>
                            "{q.feedback.whatYouCouldHaveSaid}"
                          </Text>
                        </Box>
                      </Flex>
                    </Box>
                  </Flex>
                </Card>
              ))}
            </Flex>
          </Flex>
        )}
      </Flex>
    </Container>
  )
}
