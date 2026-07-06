import { Container, Heading, Text, Flex, Grid, Card, Button, Badge, Separator, Box, Skeleton, IconButton } from '@radix-ui/themes'
import { CheckIcon, StarIcon, Cross2Icon } from '@radix-ui/react-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import * as Toast from '@radix-ui/react-toast'
import { useState, useEffect } from 'react'

export default function Billing() {
  const queryClient = useQueryClient()

  // Check URL params for payment status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      setToastType('success')
      setToastMessage('Pembayaran sedang diproses! Paket Pro Anda akan segera aktif.')
      setToastOpen(true)
      
      // Clear URL params so the toast doesn't re-trigger on refresh
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Invalidate queries to get updated tier
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['billingProfile'] })
      }, 3000)

      // Stop polling after 15 seconds
      return () => {
        clearInterval(interval)
      }
    }
  }, [queryClient])

  // Toast state
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [activePlan, setActivePlan] = useState<'pro' | 'sprint' | null>(null)

  // Query 1: Fetch user billing profile details
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['billingProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('users')
        .select('tier, subscription_status')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    }
  })

  // Query 2: Fetch count of mock interviews taken this month
  const { data: monthCount, isLoading: loadingCount } = useQuery({
    queryKey: ['monthInterviewsCount'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

      const { count, error } = await supabase
        .from('mock_interviews')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth)

      if (error) throw error
      return count || 0
    }
  })

  // Mutation: Request checkout link from backend
  const upgradeMutation = useMutation({
    mutationFn: async (plan: 'pro' | 'sprint') => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const response = await fetch('http://localhost:5005/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || 'Candidate',
          plan
        })
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to generate checkout link')
      }

      const data = await response.json()
      return data.checkoutUrl
    },
    onSuccess: (checkoutUrl) => {
      if (checkoutUrl) {
        window.location.href = checkoutUrl
      } else {
        throw new Error('No checkout URL returned')
      }
    },
    onError: (err: any) => {
      console.error('Error creating checkout:', err.message)
      setToastType('error')
      setToastMessage('Gagal mengalihkan ke pembayaran: ' + err.message)
      setToastOpen(true)
    },
    onSettled: () => {
      setActivePlan(null)
    }
  })

  const handleUpgrade = (plan: 'pro' | 'sprint') => {
    setActivePlan(plan)
    upgradeMutation.mutate(plan)
  }

  const isLoading = loadingProfile || loadingCount

  if (isLoading) {
    return (
      <Container size="3" style={{ padding: '40px 24px' }}>
        <Flex direction="column" gap="5">
          {/* Header Skeleton */}
          <Box>
            <Skeleton height="32px" width="220px" style={{ marginBottom: '8px' }} />
            <Skeleton height="16px" width="450px" />
          </Box>

          {/* Active Package Banner Skeleton */}
          <Card size="3" style={{ background: 'var(--accent-2)' }}>
            <Flex justify="between" align="center" wrap="wrap" gap="4">
              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <Skeleton height="16px" width="100px" />
                  <Skeleton height="20px" width="80px" />
                </Flex>
                <Skeleton height="24px" width="150px" />
                <Skeleton height="16px" width="260px" />
              </Flex>
              <Skeleton height="36px" width="120px" />
            </Flex>
          </Card>

          <Separator size="4" />

          {/* Price Grid Skeleton */}
          <Box>
            <Skeleton height="24px" width="180px" style={{ marginBottom: '16px' }} />
            <Grid columns={{ initial: '1', md: '3' }} gap="4">
              {[1, 2, 3].map((i) => (
                <Card key={i} size="3">
                  <Flex direction="column" gap="4" style={{ height: '100%' }}>
                    <Box>
                      <Skeleton height="24px" width="80px" style={{ marginBottom: '6px' }} />
                      <Skeleton height="14px" width="120px" />
                    </Box>
                    <Skeleton height="36px" width="100px" />
                    <Separator size="4" />
                    <Flex direction="column" gap="2">
                      <Skeleton height="16px" width="100%" />
                      <Skeleton height="16px" width="80%" />
                      <Skeleton height="16px" width="90%" />
                    </Flex>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Box>
        </Flex>
      </Container>
    )
  }

  // Active status details
  const tier = profile?.tier || 'free'

  // Calculate remaining quota for Free tier
  const totalLimit = 3
  const currentCount = monthCount || 0
  const remainingQuota = Math.max(0, totalLimit - currentCount)

  const getTierBadge = () => {
    if (tier === 'pro') return <Badge color="green" variant="solid">Pro Plan</Badge>
    if (tier === 'b2b') return <Badge color="purple" variant="solid">B2B Enterprise</Badge>
    return <Badge color="blue" variant="solid">Free Trial</Badge>
  }

  return (
    <Container size="3" style={{ padding: '40px 24px' }}>
      <Flex direction="column" gap="5">
        {/* Header Section */}
        <Box>
          <Heading size="6" mb="1">Billing & Langganan</Heading>
          <Text size="2" color="gray">
            Pilih paket yang sesuai untuk mengoptimalkan persiapan wawancara kerja Anda.
          </Text>
        </Box>

        {/* Current Subscription Status */}
        <Card size="3" style={{ background: 'var(--accent-2)' }}>
          <Flex justify="between" align="center" wrap="wrap" gap="4">
            <Flex direction="column" gap="1">
              <Flex align="center" gap="2">
                <Text size="2" weight="bold" color="gray">
                  Paket Aktif Anda
                </Text>
                {getTierBadge()}
              </Flex>
              <Heading size="2">
                {tier === 'pro' && 'Pro Tier (Langganan)'}
                {tier === 'b2b' && 'B2B Enterprise (Organisasi)'}
                {tier === 'free' && 'Free Tier (Gratis)'}
              </Heading>
              <Text size="2" color="gray">
                {tier === 'free' ? (
                  <>
                    Sisa kuota: <strong>{remainingQuota} mock interviews</strong> dari {totalLimit} limit bulan ini.
                  </>
                ) : (
                  <>
                    Kuota Anda: <strong>Sesi latihan tanpa batas (unlimited)</strong>.
                  </>
                )}
              </Text>
            </Flex>
            {tier === 'free' && (
              <Button
                variant="soft"
                color="blue"
                onClick={() => handleUpgrade('pro')}
                loading={upgradeMutation.isPending && activePlan === 'pro'}
              >
                Upgrade ke Pro
              </Button>
            )}
          </Flex>
        </Card>

        <Separator size="4" />

        {/* Pricing Grid */}
        <Box>
          <Heading size="4" mb="4">Paket & Layanan Tersedia</Heading>
          <Grid columns={{ initial: '1', md: '3' }} gap="4">
            {/* Free Plan */}
            <Card size="3">
              <Flex direction="column" gap="4" style={{ height: '100%' }}>
                <Flex direction="column" gap="1">
                  <Heading size="3">Free</Heading>
                  <Text size="1" color="gray">Untuk perkenalan awal</Text>
                </Flex>

                <Flex align="baseline" gap="1">
                  <Text size="6" weight="bold">Rp 0</Text>
                  <Text size="2" color="gray">/ bulan</Text>
                </Flex>

                <Separator size="4" />

                <Flex direction="column" gap="2" style={{ flexGrow: 1 }}>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">3 mock interviews / bulan</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Umpan balik dasar (basic feedback)</Text>
                  </Flex>
                </Flex>

                <Button
                  size="2"
                  variant="outline"
                  disabled={tier === 'free'}
                  style={{ marginTop: 'auto' }}
                >
                  {tier === 'free' ? 'Paket Aktif' : 'Free Tier'}
                </Button>
              </Flex>
            </Card>

            {/* Pro Plan */}
            <Card size="3" style={{ border: tier === 'pro' ? '2px solid var(--green-9)' : '2px solid var(--accent-9)' }}>
              <Flex direction="column" gap="4" style={{ height: '100%' }}>
                <Flex justify="between" align="start">
                  <Flex direction="column" gap="1">
                    <Heading size="3">Pro</Heading>
                    <Text size="1" color="gray">Untuk pencari kerja aktif</Text>
                  </Flex>
                  <Badge size="2" variant="solid">
                    <Flex align="center" gap="1">
                      <StarIcon /> Populer
                    </Flex>
                  </Badge>
                </Flex>

                <Flex align="baseline" gap="1">
                  <Text size="6" weight="bold">Rp 99.000</Text>
                  <Text size="2" color="gray">/ bulan</Text>
                </Flex>

                <Separator size="4" />

                <Flex direction="column" gap="2" style={{ flexGrow: 1 }}>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Sesi latihan tanpa batas (unlimited)</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Umpan balik AI tingkat lanjut</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Analitik progres latihan</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Role deep-dive kustom</Text>
                  </Flex>
                </Flex>

                <Button
                  size="2"
                  variant={tier === 'pro' ? 'outline' : 'solid'}
                  disabled={tier === 'pro'}
                  onClick={() => handleUpgrade('pro')}
                  loading={upgradeMutation.isPending && activePlan === 'pro'}
                  style={{ marginTop: 'auto' }}
                >
                  {tier === 'pro' ? 'Paket Aktif' : 'Langganan Pro'}
                </Button>
              </Flex>
            </Card>

            {/* 14-day Interview Sprint Plan */}
            <Card size="3">
              <Flex direction="column" gap="4" style={{ height: '100%' }}>
                <Flex direction="column" gap="1">
                  <Flex align="center" gap="2">
                    <Heading size="3">14-Day Sprint</Heading>
                    <Badge color="orange">Spesial</Badge>
                  </Flex>
                  <Text size="1" color="gray">Persiapan intensif waktu singkat</Text>
                </Flex>

                <Flex align="baseline" gap="1">
                  <Text size="6" weight="bold">Rp 390.000</Text>
                  <Text size="2" color="gray">/ paket</Text>
                </Flex>

                <Separator size="4" />

                <Flex direction="column" gap="2" style={{ flexGrow: 1 }}>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Masa aktif program 14 hari</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Umpan balik instan & terstruktur</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Pertanyaan posisi spesifik & custom</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Dirancang khusus untuk wawancara &lt; 30 hari</Text>
                  </Flex>
                </Flex>

                <Button 
                  size="2" 
                  variant="solid" 
                  color="orange" 
                  onClick={() => handleUpgrade('sprint')}
                  loading={upgradeMutation.isPending && activePlan === 'sprint'}
                  disabled={tier === 'pro'}
                  style={{ marginTop: 'auto', cursor: 'pointer' }}
                >
                  Beli Paket Sprint
                </Button>
              </Flex>
            </Card>
          </Grid>
        </Box>

        {/* B2B Plan Footer */}
        <Card size="2" style={{ marginTop: '16px' }}>
          <Flex justify="between" align="center" wrap="wrap" gap="3">
            <Flex direction="column" gap="1">
              <Heading size="3">Kebutuhan Organisasi / B2B?</Heading>
              <Text size="2" color="gray">
                Kami menyediakan lisensi massal, dasboard HR terintegrasi, dan kustomisasi pelacakan kandidat untuk universitas atau bootcamp.
              </Text>
            </Flex>
            <Button size="2" variant="outline" disabled={tier === 'b2b'}>
              {tier === 'b2b' ? 'Aktif' : 'Hubungi Kami'}
            </Button>
          </Flex>
        </Card>
      </Flex>

      <Toast.Provider swipeDirection="right">
        <Toast.Root
          open={toastOpen}
          onOpenChange={setToastOpen}
          style={{
            background: toastType === 'success' ? 'var(--green-3)' : 'var(--red-3)',
            border: `1px solid ${toastType === 'success' ? 'var(--green-6)' : 'var(--red-6)'}`,
            borderRadius: '8px',
            boxShadow: 'var(--shadow-4)',
            padding: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            gap: '12px',
            position: 'relative',
          }}
        >
          <Flex direction="column" gap="1" style={{ flexGrow: 1 }}>
            <Toast.Title style={{ fontWeight: 'bold', fontSize: '14px', color: toastType === 'success' ? 'var(--green-11)' : 'var(--red-11)' }}>
              {toastType === 'success' ? 'Sukses' : 'Gagal'}
            </Toast.Title>
            <Toast.Description style={{ fontSize: '13px', color: toastType === 'success' ? 'var(--green-11)' : 'var(--red-11)' }}>
              {toastMessage}
            </Toast.Description>
          </Flex>
          <Toast.Close asChild>
            <IconButton
              size="1"
              variant="ghost"
              color={toastType === 'success' ? 'green' : 'red'}
              style={{ cursor: 'pointer', borderRadius: '50%', marginTop: '-2px' }}
            >
              <Cross2Icon width="14" height="14" />
            </IconButton>
          </Toast.Close>
        </Toast.Root>

        <Toast.Viewport
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '320px',
            maxWidth: '100vw',
            margin: 0,
            listStyle: 'none',
            zIndex: 9999,
            outline: 'none',
          }}
        />
      </Toast.Provider>
    </Container>
  )
}
