interface GoogleMapProps {
  className?: string;
}

export default function GoogleMap({ className = "" }: GoogleMapProps) {
  // The Square Compound, New Cairo, Egypt
  // Coordinates: 29.99822, 31.55186
  const mapSrc = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3455.5!2d31.55186!3d29.99822!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14583cd0c8e8e8e7%3A0x1234567890abcdef!2sThe%20Square%20Compound!5e0!3m2!1sen!2seg!4v1701878400000";

  return (
    <div className={`rounded-xl overflow-hidden shadow-lg ${className}`}>
      <iframe
        src={mapSrc}
        width="100%"
        height="400"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Future Stars FC Academy - The Square Compound, New Cairo"
        className="w-full"
      />
    </div>
  );
}
