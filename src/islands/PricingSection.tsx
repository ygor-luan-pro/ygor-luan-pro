import CheckoutButton from './CheckoutButton';
import type { PricingProduct } from '../types';

interface PricingSectionProps {
  isLaunchMode: boolean;
  spotsRemaining: number;
  products: PricingProduct[];
}

function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR');
}

export default function PricingSection({ isLaunchMode, spotsRemaining, products }: PricingSectionProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {products.map((product) => (
        <div
          key={product.id}
          style={{
            backgroundColor: 'var(--mahogany)',
            border: product.highlighted ? '1px solid var(--copper)' : '1px solid var(--blade)',
            position: 'relative',
          }}
          className="p-8 flex flex-col"
        >
          {product.highlighted && (
            <span
              style={{
                position: 'absolute',
                top: '-1px',
                right: '2rem',
                backgroundColor: 'var(--copper)',
                color: 'var(--espresso)',
                fontSize: '0.625rem',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '0.25rem 0.75rem',
              }}
            >
              Mais Popular
            </span>
          )}

          <p
            className="font-sans text-sm tracking-widest uppercase mb-2"
            style={{ color: 'var(--copper)' }}
          >
            {product.eyebrow}
          </p>

          <h3
            className="font-display font-semibold mb-6"
            style={{ fontSize: '1.5rem', color: 'var(--cream)' }}
          >
            {product.title}
          </h3>

          <ul className="space-y-2 font-sans text-sm mb-8 flex-1" style={{ color: 'var(--parchment)' }}>
            {product.features.map((feature) => (
              <li key={feature}>
                <span style={{ color: 'var(--copper)' }}>—</span> {feature}
              </li>
            ))}
          </ul>

          <div className="mb-6">
            {product.highlighted && isLaunchMode && product.originalPrice && (
              <p className="font-sans text-sm line-through mb-1" style={{ color: 'var(--fade)' }}>
                De R$ {formatPrice(product.originalPrice)}
              </p>
            )}
            <p
              className="font-mono font-medium leading-none"
              style={{ fontSize: '2.5rem', color: 'var(--cream)' }}
            >
              R$ {formatPrice(product.price)}
            </p>
            <p className="font-sans text-sm mt-1" style={{ color: 'var(--fade)' }}>
              pagamento único
            </p>
          </div>

          {product.highlighted && isLaunchMode && (
            <div className="mb-6">
              <div className="flex justify-between font-sans text-xs mb-1" style={{ color: 'var(--fade)' }}>
                <span>Vagas restantes</span>
                <span style={{ color: spotsRemaining > 0 ? 'var(--copper)' : '#f87171' }}>
                  {spotsRemaining > 0 ? `${spotsRemaining} vagas` : 'Esgotado'}
                </span>
              </div>
              <div style={{ height: '2px', backgroundColor: 'var(--blade)' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, ((15 - spotsRemaining) / 15) * 100)}%`,
                    backgroundColor: 'var(--copper)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>
          )}

          <CheckoutButton
            fullWidth
            productId={product.id}
            ctaText={product.highlighted && spotsRemaining <= 0 ? 'Lista de Espera' : product.cta}
            disabled={product.highlighted && isLaunchMode && spotsRemaining <= 0}
          />
        </div>
      ))}
    </div>
  );
}
