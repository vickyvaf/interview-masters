import { Container, Heading, Text, Flex, Grid, Card, Button, Badge, Separator, Box, Skeleton, IconButton } from '@radix-ui/themes'
import { CheckIcon, StarIcon, Cross2Icon } from '@radix-ui/react-icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import * as Toast from '@radix-ui/react-toast'
import { useState, useEffect } from 'react'

export default function Billing() {
  const queryClient = useQueryClient()

  // Check URL params for payment status and sync subscription status
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('payment') === 'success') {
      const planParam = params.get('plan') || 'pro'
      
      // Instantly sync subscription tier to Supabase
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          const apiBaseUrl = import.meta.env.VITE_API_URL || (
            window.location.hostname === 'localhost'
              ? 'http://localhost:5005'
              : 'https://backend-interviewmasters.netlify.app'
          );

          fetch(`${apiBaseUrl}/payments/sync-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, plan: planParam })
          })
            .then((res) => res.json())
            .then(() => {
              queryClient.invalidateQueries({ queryKey: ['billingProfile'] })
            })
            .catch((err) => console.error('[Billing] Failed to sync subscription:', err))
        }
      })

      setToastType('success')
      setToastMessage('Pembayaran berhasil! Paket Anda telah aktif.')
      setToastOpen(true)
      
      // Clear URL params so the toast doesn't re-trigger on refresh
      window.history.replaceState({}, document.title, window.location.pathname)
      
      // Invalidate queries to get updated tier
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ['billingProfile'] })
      }, 2000)

      return () => {
        clearInterval(interval)
      }
    }
  }, [queryClient])

  // Toast state
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [activePlan, setActivePlan] = useState<'pro' | 'starter' | 'sprint' | null>(null)

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
    mutationFn: async (plan: 'pro' | 'starter' | 'sprint') => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const apiBaseUrl = import.meta.env.VITE_API_URL || (
        window.location.hostname === 'localhost'
          ? 'http://localhost:5005'
          : 'https://backend-interviewmasters.netlify.app'
      );

      const response = await fetch(`${apiBaseUrl}/payments/create-checkout`, {
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

  const handleUpgrade = (plan: 'pro' | 'starter' | 'sprint') => {
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
            <Skeleton width="180px" height="32px" style={{ marginBottom: '8px' }} />
            <Skeleton width="300px" height="18px" />
          </Box>
          <Grid columns={{ initial: '1', md: '3' }} gap="4">
            <Skeleton height="340px" style={{ borderRadius: '12px' }} />
            <Skeleton height="340px" style={{ borderRadius: '12px' }} />
            <Skeleton height="340px" style={{ borderRadius: '12px' }} />
          </Grid>
        </Flex>
      </Container>
    )
  }

  const tier = profile?.tier || 'free'
  const isSubscribed = profile?.subscription_status === 'active'

  return (
    <Container size="3" style={{ padding: '45px 24px 60px 24px' }}>
      <Flex direction="column" gap="6">
        {/* Page Title Header */}
        <Box>
          <Heading size="6" weight="bold" style={{ marginBottom: '4px' }}>
            Billing & Langganan
          </Heading>
          <Text size="2" color="gray">
            Kelola paket langganan Anda dan lihat histori kuota wawancara.
          </Text>
        </Box>

        {/* Current Active Plan Banner */}
        <Card size="3" style={{ background: 'var(--gray-2)', border: '1px solid var(--gray-4)' }}>
          <Flex justify="between" align="center" wrap="wrap" gap="4">
            <Flex direction="column" gap="1">
              <Flex align="center" gap="2">
                <Text size="2" color="gray">Paket Saat Ini:</Text>
                {tier === 'free' && <Badge color="gray" variant="soft">Free</Badge>}
                {tier === 'pro' && <Badge color="green" variant="solid">Pro (Unlimited)</Badge>}
                {tier === 'starter' && <Badge color="amber" variant="solid">Starter Pass</Badge>}
                {tier === 'sprint' && <Badge color="orange" variant="solid">14-Day Sprint</Badge>}
              </Flex>
              <Text size="4" weight="bold">
                {tier === 'free' && 'Akun Gratis'}
                {tier === 'pro' && 'Pro Subscription (Unlimited)'}
                {tier === 'starter' && 'Starter Pass (Sekali Bayar)'}
                {tier === 'sprint' && '14-Day Sprint (Program)'}
              </Text>
              <Text size="2" color="gray">
                {tier === 'pro' && isSubscribed
                  ? 'Langganan aktif. Bebas simulasi wawancara sepuasnya.'
                  : tier === 'starter'
                  ? 'Paket Starter Pass aktif (3 sesi wawancara / 7 hari).'
                  : tier === 'sprint'
                  ? 'Program Sprint 14 hari aktif.'
                  : `Anda telah menggunakan ${monthCount} dari 1 sesi gratis bulan ini.`}
              </Text>
            </Flex>

            {tier === 'pro' && (
              <Button variant="outline" color="red" size="2">
                Batalkan Langganan
              </Button>
            )}
          </Flex>
        </Card>

        {/* Pricing Cards Selection */}
        <Box>
          <Heading size="4" weight="bold" style={{ marginBottom: '16px' }}>
            Pilih Paket Layanan
          </Heading>
          
          <Grid columns={{ initial: '1', md: '3' }} gap="4" align="stretch">
            {/* Free Plan */}
            <Card size="3" style={{ border: tier === 'free' ? '2px solid var(--gray-8)' : '1px solid var(--gray-5)' }}>
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
                    <Text size="2">1 mock interview / bulan</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Umpan balik dasar (basic feedback)</Text>
                  </Flex>
                </Flex>

                <Button size="2" variant="outline" disabled style={{ marginTop: 'auto' }}>
                  {tier === 'free' ? 'Paket Aktif' : 'Gratis'}
                </Button>
              </Flex>
            </Card>

            {/* Pro Plan */}
            <Card size="3" style={{ border: tier === 'pro' ? '2px solid var(--green-9)' : '1px solid var(--gray-5)' }}>
              <Flex direction="column" gap="4" style={{ height: '100%' }}>
                <Flex justify="between" align="start">
                  <Flex direction="column" gap="1">
                    <Heading size="3">Pro</Heading>
                    <Text size="1" color="gray">Untuk pencari kerja aktif</Text>
                  </Flex>
                  <Badge size="2" variant="solid">
                    <Flex align="center" gap="1">
                      <StarIcon /> Paling Populer
                    </Flex>
                  </Badge>
                </Flex>

                <Flex align="baseline" gap="1">
                  <Text size="6" weight="bold">Rp 49.000</Text>
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

            {/* Starter Pass Plan */}
            <Card size="3" style={{ border: tier === 'starter' ? '2px solid var(--amber-9)' : '1px solid var(--gray-5)' }}>
              <Flex direction="column" gap="4" style={{ height: '100%' }}>
                <Flex justify="between" align="start">
                  <Flex direction="column" gap="1">
                    <Heading size="3">Starter Pass</Heading>
                    <Text size="1" color="gray">Sekali bayar tanpa berlangganan</Text>
                  </Flex>
                  <Badge color="amber">Sekali Bayar</Badge>
                </Flex>

                <Flex align="baseline" gap="1">
                  <Text size="6" weight="bold">Rp 19.000</Text>
                  <Text size="2" color="gray">/ paket</Text>
                </Flex>

                <Separator size="4" />

                <Flex direction="column" gap="2" style={{ flexGrow: 1 }}>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">3x simulasi wawancara lengkap</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Masa aktif program 7 hari</Text>
                  </Flex>
                  <Flex align="center" gap="2">
                    <CheckIcon color="var(--green-9)" />
                    <Text size="2">Umpan balik instan & terstruktur</Text>
                  </Flex>
                </Flex>

                <Button 
                  size="2" 
                  variant={tier === 'starter' ? 'outline' : 'solid'} 
                  color="amber" 
                  onClick={() => handleUpgrade('starter')}
                  loading={upgradeMutation.isPending && activePlan === 'starter'}
                  disabled={tier === 'starter'}
                  style={{ marginTop: 'auto' }}
                >
                  {tier === 'starter' ? 'Paket Aktif' : 'Beli Starter Pass'}
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
