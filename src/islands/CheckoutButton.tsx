interface CheckoutButtonProps {
  checkoutUrl: string;
  fullWidth?: boolean;
  ctaText?: string;
  disabled?: boolean;
}

export default function CheckoutButton({
  checkoutUrl,
  fullWidth = false,
  ctaText = "Quero começar →",
  disabled = false,
}: CheckoutButtonProps) {
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        className={`btn-primary${fullWidth ? " w-full" : ""}`}
        style={{ opacity: 0.5, cursor: "not-allowed" }}
      >
        {ctaText}
      </button>
    );
  }

  return (
    <a
      href={checkoutUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-primary${fullWidth ? " w-full" : ""}`}
      style={{ display: "inline-block", textAlign: "center" }}
    >
      {ctaText}
    </a>
  );
}
