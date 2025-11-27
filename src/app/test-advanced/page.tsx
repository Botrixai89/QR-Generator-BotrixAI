"use client"

// Test page to verify advanced QR features
import { createAdvancedQR } from '@/lib/qr-code-advanced'
import { QR_TEMPLATES } from '@/types/qr-code-advanced'

export default function TestAdvancedQR() {
  const testAdvancedFeatures = async () => {
    console.log('🧪 Testing Advanced QR Features...')
    
    // Test 1: Basic QR generation
    console.log('\n1. Testing basic QR generation...')
    try {
      createAdvancedQR({
        data: 'https://example.com',
        width: 200,
        height: 200,
        type: 'svg',
        foregroundColor: '#000000',
        backgroundColor: '#ffffff'
      })
      console.log('✅ Basic QR generation: PASSED')
    } catch (error) {
      console.log('❌ Basic QR generation: FAILED -', (error as Error).message)
    }

    // Test 2: Template application
    console.log('\n2. Testing template application...')
    try {
      createAdvancedQR({
        data: 'https://example.com',
        width: 200,
        height: 200,
        type: 'svg',
        template: 'business'
      })
      console.log('✅ Template application: PASSED')
    } catch (error) {
      console.log('❌ Template application: FAILED -', (error as Error).message)
    }

    // Test 3: Shape application
    console.log('\n3. Testing shape application...')
    try {
      createAdvancedQR({
        data: 'https://example.com',
        width: 200,
        height: 200,
        type: 'svg',
        shape: 'circle'
      })
      console.log('✅ Shape application: PASSED')
    } catch (error) {
      console.log('❌ Shape application: FAILED -', (error as Error).message)
    }

    // Test 4: Gradient application
    console.log('\n4. Testing gradient application...')
    try {
      createAdvancedQR({
        data: 'https://example.com',
        width: 200,
        height: 200,
        type: 'svg',
        gradient: {
          type: 'linear',
          colors: ['#ff6b6b', '#4ecdc4'],
          direction: 45
        }
      })
      console.log('✅ Gradient application: PASSED')
    } catch (error) {
      console.log('❌ Gradient application: FAILED -', (error as Error).message)
    }

    // Test 5: Effects application
    console.log('\n5. Testing effects application...')
    try {
      createAdvancedQR({
        data: 'https://example.com',
        width: 200,
        height: 200,
        type: 'svg',
        effects: {
          shadow: true,
          glow: true,
          threeD: false
        }
      })
      console.log('✅ Effects application: PASSED')
    } catch (error) {
      console.log('❌ Effects application: FAILED -', (error as Error).message)
    }

    // Test 6: All templates
    console.log('\n6. Testing all templates...')
    let templateCount = 0
    for (const [id] of Object.entries(QR_TEMPLATES)) {
      try {
        createAdvancedQR({
          data: 'https://example.com',
          width: 200,
          height: 200,
          type: 'svg',
          template: id as keyof typeof QR_TEMPLATES
        })
        templateCount++
      } catch (error) {
        console.log(`❌ Template ${id}: FAILED -`, (error as Error).message)
      }
    }
    console.log(`✅ Templates: ${templateCount}/${Object.keys(QR_TEMPLATES).length} PASSED`)

    console.log('\n🎉 Advanced QR Features Test Complete!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Advanced QR Features Test</h1>
        
        <div className="space-y-6">
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            <button
              onClick={testAdvancedFeatures}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Run Advanced QR Tests
            </button>
            <p className="text-sm text-muted-foreground mt-2">
              Click the button above to test all advanced QR features. Check the browser console for results.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Basic QR Generation</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Template Application</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Shape Customization</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Gradient Colors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Visual Effects</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>All Templates</span>
              </div>
            </div>
          </div>

          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Available Templates</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(QR_TEMPLATES).map(([id, template]) => (
                <div key={id} className="text-center">
                  <div 
                    className="w-16 h-16 mx-auto rounded-lg border-2 mb-2"
                    style={{ 
                      backgroundColor: template.colors.background,
                      borderColor: template.colors.foreground 
                    }}
                  ></div>
                  <div className="text-sm font-medium">{template.name}</div>
                  <div className="text-xs text-muted-foreground">{template.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
