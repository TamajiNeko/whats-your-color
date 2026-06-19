"use client";

import { generateBarcodeLines } from "./TicketVisual";

export default function TicketCard({
  header,
  route,
  passenger,
  details = [],
  detailsStyle,
  stub,
  overlay,
  className = "",
  style = {},
}) {
  const barcodeData = generateBarcodeLines(stub?.barcodeId);

  return (
    <div className={`ticket-container ${className}`} style={style}>
      {/* Main Ticket */}
      <div className="ticket-main">
        {overlay && overlay}

        {/* Header */}
        <div
          className="ticket-header-brand ticket-header-colored"
          style={{ backgroundColor: header.bgColor }}
        >
          <span
            className="brand-logo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "rgba(255,255,255,0.95)",
            }}
          >
            {header.icon}
            <span>
              {header.title}
            </span>
          </span>
          <span
            className="ticket-serial"
            style={{ color: "rgba(255,255,255,0.8)" }}
          >
            {header.serial}
          </span>
        </div>

        {/* Route */}
        <div className="ticket-route">
          <div className="route-code">
            <h4>{route.fromCode}</h4>
            <span className="route-label">{route.fromLabel}</span>
          </div>
          <div className="route-arrow">
            <div
              className="route-line"
            />
            <div className="route-plane">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ color: route.accentColor }}
              >
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-5.5l7 2.5z" />
              </svg>
            </div>
          </div>
          <div className="route-code right-align">
            <h4 style={route.toStyle}>{route.toCode}</h4>
            <span className="route-label" style={route.toStyle}>
              {route.toLabel}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="ticket-content-wrapper">
          <div className="ticket-passenger-section">
            <div className="avatar-frame">{passenger.avatar}</div>
            <div className="passenger-info">
              <span
                className="passenger-label"
                style={passenger.labelStyle}
              >
                {passenger.label}
              </span>
              <h3 className="passenger-name" style={passenger.nameStyle}>
                {passenger.name}
              </h3>
              <span className="passenger-id">{passenger.subtitle}</span>
            </div>
          </div>

          <div className="ticket-details-grid" style={detailsStyle}>
            {details.map((d, i) => (
              <div className="detail-box" key={i}>
                <span className="detail-label">{d.label}</span>
                <span className="detail-val" style={d.valueStyle}>
                  {d.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ticket Stub */}
      <div
        className="ticket-stub"
        style={{
          backgroundColor: stub.bgColor,
          borderColor: stub.bgColor,
          ...stub.stubStyle,
        }}
      >
        <div
          className="stub-header"
          style={
            stub.bgColor
              ? { borderBottomColor: "rgba(255,255,255,0.25)" }
              : undefined
          }
        >
          <span style={stub.headerLeftStyle}>{stub.headerLeft}</span>
          <span style={stub.headerRightStyle}>{stub.headerRight}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          {stub.qrUrl && (
            <div
              style={{
                padding: "4px",
                background: "#fff",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.3)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                ...stub.qrWrapperStyle,
              }}
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                  stub.qrUrl
                )}`}
                alt="QR Code"
                width="70"
                height="70"
                crossOrigin="anonymous"
                style={{ display: "block" }}
              />
            </div>
          )}
          <div
            className="barcode-container"
            style={{
              width: "80px",
              marginTop: 0,
              paddingTop: 0,
              border: "none",
              ...stub.barcodeContainerStyle,
            }}
          >
            <svg
              className="barcode-svg"
              viewBox={`0 0 ${barcodeData.totalWidth} 26`}
              style={{
                width: "100%",
                height: "auto",
                ...(stub.barcodeFilter
                  ? { filter: stub.barcodeFilter }
                  : {}),
              }}
            >
              {barcodeData.bars}
            </svg>
            <span
              className="barcode-label"
              style={{
                fontSize: "0.55rem",
                letterSpacing: "0.05em",
                marginTop: "2px",
                paddingLeft: 0,
                ...stub.barcodeLabelStyle,
              }}
            >
              {stub.barcodeLabel}
            </span>
          </div>
        </div>
        <div
          className="stub-footer"
          style={{
            borderTopColor: "rgba(255,255,255,0.25)",
            ...stub.footerStyle,
          }}
        >
          <span>{stub.footerText}</span>
        </div>
      </div>
    </div>
  );
}
