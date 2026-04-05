import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import { Img } from "../../components";
import ContactFormModal from "../ContactFormModal";
import { ContactFormData } from "../ContactFormModal/types";
import { globalVariables } from "../../utils";
import ReactGA from "react-ga4";

type FooterProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
> &
  Partial<{
    showLogo?: boolean;
  }>;

const PARTNERS_ROW_1 = [
  { href: "https://www.groundtruth.co.za", src: "img_image6.png", alt: "Ground Truth" },
  { href: "https://www.unicef.org/", src: "patners_logo_5.png", alt: "UNICEF" },
  { href: "https://www.cgiar.org", src: "patners_logo_4.png", alt: "CGIAR" },
  { href: "https://www.iwmi.cgiar.org", src: "patners_logo_2.png", alt: "IWMI" },
];

const PARTNERS_ROW_2 = [
  { href: "https://www.wrc.org.za/", src: "patners_logo_6.jpg", alt: "Water Research Commission" },
  { href: "https://wessa.org.za/", src: "patners_logo_8.png", alt: "WESSA" },
  { href: "https://kartoza.com/", src: "patners_logo_7.png", alt: "Kartoza" },
  { href: "#", src: "uMngeni-uThukela_ logo.jpg", alt: "uMngeni-uThukela" },
];

const Footer: React.FC<FooterProps> = ({ className = "", showLogo = true, ...rest }) => {
  const navigate = useNavigate();
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <footer className={className} {...rest}>
      {/* Partner logos */}
      {showLogo && (
        <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 items-center gap-8 sm:grid-cols-4">
            {PARTNERS_ROW_1.map((p) => (
              <a
                key={p.alt}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center transition-opacity hover:opacity-80"
              >
                <Img
                  className="h-16 w-auto object-contain sm:h-20 lg:h-24"
                  src={`${globalVariables.staticPath}${p.src}`}
                  alt={p.alt}
                />
              </a>
            ))}
          </div>
          <div className="mt-8 grid grid-cols-2 items-center gap-8 sm:grid-cols-4">
            {PARTNERS_ROW_2.map((p) => (
              <a
                key={p.alt}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center transition-opacity hover:opacity-80"
              >
                <Img
                  className="h-16 w-auto object-contain sm:h-20 lg:h-24"
                  src={`${globalVariables.staticPath}${p.src}`}
                  alt={p.alt}
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="rounded-tl-[3rem] bg-primary px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-content flex-col items-center gap-8">
          {/* Logo */}
          <Img
            className="h-10 w-auto object-contain"
            src={`${globalVariables.staticPath}replacement_logo.png`}
            alt="miniSASS"
          />

          {/* Nav links */}
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <li>
                <HashLink
                  to="/howto#howto-title"
                  className="text-body-sm font-extrabold uppercase tracking-wider text-text-inverse hover:underline"
                >
                  How to
                </HashLink>
              </li>
              <li>
                <button
                  onClick={() => navigate("/map")}
                  className="text-body-sm font-extrabold uppercase tracking-wider text-text-inverse hover:underline"
                >
                  Map
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    ReactGA.event("documentation", {
                      category: "User Engagement",
                      label: "Clicked Documentation",
                    });
                    window.open("https://kartoza.github.io/miniSASS/", "_blank");
                  }}
                  className="text-body-sm font-extrabold uppercase tracking-wider text-text-inverse hover:underline"
                >
                  Documentation
                </button>
              </li>
              <li>
                <button
                  onClick={() => setContactOpen(true)}
                  className="text-body-sm font-extrabold uppercase tracking-wider text-text-inverse hover:underline"
                >
                  Contact us
                </button>
              </li>
              <li>
                <HashLink
                  to="/privacy-policy#privacy-policy-title"
                  className="text-body-sm font-extrabold uppercase tracking-wider text-text-inverse hover:underline"
                >
                  Privacy Policy
                </HashLink>
              </li>
            </ul>
          </nav>

          {/* Social */}
          <a
            href="https://www.youtube.com/@groundtruthcitizenscience"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-80"
            aria-label="YouTube channel"
          >
            <Img
              className="h-6 w-6"
              src={`${globalVariables.staticPath}img_riyoutubefill_white_a700.svg`}
              alt="YouTube"
            />
          </a>

          {/* Copyright */}
          <p className="text-center text-body text-text-inverse">
            &copy; International Water Management Institute (IWMI) and UNICEF.
          </p>
        </div>
      </div>

      <ContactFormModal
        isOpen={contactOpen}
        onClose={() => setContactOpen(false)}
        onSubmit={(data: ContactFormData) => setContactOpen(false)}
      />
    </footer>
  );
};

export default Footer;
