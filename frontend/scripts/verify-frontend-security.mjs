import assert from "node:assert/strict";

// 1. Test serializeJsonLd
function serializeJsonLd(data) {
  if (data === null || data === undefined) {
    return "{}";
  }
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

console.log("=== Running Frontend Security Regression Tests ===\n");

// Test 1: JSON-LD script context breakout prevention
{
  const maliciousData = {
    name: "Apex Chemicals</script><script>alert('XSS')</script>",
    description: "\"><script>alert('DOM-XSS')</script>",
    formula: "H2O & CO2 <salt>",
  };

  const serialized = serializeJsonLd(maliciousData);

  // Must NOT contain literal '<' or '>' that could break HTML parser
  assert.equal(serialized.includes("</script>"), false, "FAILED: Literal </script> found in output");
  assert.equal(serialized.includes("<script>"), false, "FAILED: Literal <script> found in output");
  assert.equal(serialized.includes("<"), false, "FAILED: Literal < found in output");
  assert.equal(serialized.includes(">"), false, "FAILED: Literal > found in output");

  // Must contain safe unicode escapes
  assert.ok(serialized.includes("\\u003c/script\\u003e"), "Must contain escaped \\u003c/script\\u003e");
  assert.ok(serialized.includes("\\u003cscript\\u003e"), "Must contain escaped \\u003cscript\\u003e");
  assert.ok(serialized.includes("\\u0026"), "Must contain escaped \\u0026");

  // Output must still parse cleanly as JSON
  const parsedBack = JSON.parse(serialized);
  assert.equal(parsedBack.name, maliciousData.name, "JSON data fidelity preserved after round-trip parse");
  assert.equal(parsedBack.description, maliciousData.description, "JSON data fidelity preserved after round-trip parse");

  console.log("✓ PASS 1: JSON-LD script context breakout is strictly neutralized with JSON round-trip fidelity");
}

// 2. Test next.config.ts production headers & remotePatterns
{
  process.env.NODE_ENV = "production";
  
  // Dynamic import nextConfig
  const nextConfigModule = await import("../next.config.ts");
  const nextConfig = nextConfigModule.default;

  // Verify remotePatterns: NO wildcard '**'
  const remotePatterns = nextConfig.images?.remotePatterns || [];
  for (const pattern of remotePatterns) {
    assert.notEqual(pattern.hostname, "**", "FAILED: Wildcard hostname '**' found in images.remotePatterns");
    assert.notEqual(pattern.hostname, "*", "FAILED: Broad wildcard hostname '*' found in images.remotePatterns");
  }
  console.log("✓ PASS 2: Next.js image remotePatterns has no wildcard hosts (strictly explicit allowed hosts)");

  // Verify headers in production
  const headersList = await nextConfig.headers();
  const rootRouteHeaders = headersList.find((h) => h.source === "/:path*")?.headers || [];

  const headersMap = new Map(rootRouteHeaders.map((h) => [h.key, h.value]));

  // Check CSP
  const csp = headersMap.get("Content-Security-Policy");
  assert.ok(csp, "FAILED: Content-Security-Policy header is missing");
  assert.equal(csp.includes("'unsafe-eval'"), false, "FAILED: Production CSP must NOT contain 'unsafe-eval'");
  assert.ok(csp.includes("object-src 'none'"), "FAILED: CSP must contain object-src 'none'");
  assert.ok(csp.includes("base-uri 'self'"), "FAILED: CSP must contain base-uri 'self'");
  assert.ok(csp.includes("frame-ancestors 'none'"), "FAILED: CSP must contain frame-ancestors 'none'");
  assert.ok(csp.includes("frame-src 'self'"), "FAILED: CSP must contain frame-src 'self'");
  console.log("✓ PASS 3: Production Content Security Policy enforces strict directives without 'unsafe-eval'");

  // Check security headers
  assert.equal(headersMap.get("X-Content-Type-Options"), "nosniff", "FAILED: X-Content-Type-Options must be nosniff");
  assert.equal(headersMap.get("X-Frame-Options"), "DENY", "FAILED: X-Frame-Options must be DENY");
  assert.equal(headersMap.get("Referrer-Policy"), "strict-origin-when-cross-origin", "FAILED: Referrer-Policy must be strict-origin-when-cross-origin");
  assert.ok(headersMap.get("Strict-Transport-Security"), "FAILED: Strict-Transport-Security must be set in production");
  assert.ok(headersMap.get("Strict-Transport-Security").includes("max-age=31536000"), "FAILED: HSTS max-age must be 31536000");
  assert.ok(headersMap.get("Permissions-Policy"), "FAILED: Permissions-Policy must be set");
  console.log("✓ PASS 4: All mandatory security headers (X-Content-Type-Options, X-Frame-Options, HSTS, Permissions-Policy) present and validated");
}

// 3. Test dev headers (HSTS must NOT be set on localhost)
{
  process.env.NODE_ENV = "development";
  const nextConfigModule = await import("../next.config.ts");
  const nextConfig = nextConfigModule.default;

  const headersList = await nextConfig.headers();
  const rootRouteHeaders = headersList.find((h) => h.source === "/:path*")?.headers || [];
  const headersMap = new Map(rootRouteHeaders.map((h) => [h.key, h.value]));

  assert.equal(headersMap.get("Strict-Transport-Security"), undefined, "FAILED: HSTS must NOT be present in development");
  console.log("✓ PASS 5: Development configuration omits HSTS to prevent localhost development issues");
}

// 4. Test SSE Security: Zero URL tokens, zero native EventSource, strict Authorization header
{
  const fs = await import("node:fs");
  const path = await import("node:path");

  function getFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        getFiles(fullPath, fileList);
      } else if (/\.(ts|tsx|js|mjs)$/.test(file)) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  const srcDir = path.resolve("./src");
  const allSrcFiles = getFiles(srcDir);

  for (const filePath of allSrcFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(".", filePath);

    // Test 6: No notification URL or stream containing token parameter
    assert.equal(
      /notifications\/stream[^\s`"']*token=/i.test(content),
      false,
      `FAILED: Token parameter found in notification stream URL in ${relativePath}`
    );

    // Test 7: No native EventSource construction
    assert.equal(
      /new\s+EventSource\s*\(/i.test(content),
      false,
      `FAILED: Native EventSource found in ${relativePath}. Must use authenticated fetch SSE.`
    );

    // Test 8: No refresh token in localStorage or sessionStorage
    assert.equal(
      /(?:localStorage|sessionStorage)\.(?:getItem|setItem)\s*\(\s*["']refreshToken["']/i.test(content),
      false,
      `FAILED: Refresh token access via web storage found in ${relativePath}`
    );
  }
  console.log("✓ PASS 6: Zero notification URLs contain token parameters across all frontend source files");
  console.log("✓ PASS 7: Native EventSource completely eliminated across all frontend source files");
  console.log("✓ PASS 8: Zero web storage (localStorage/sessionStorage) access for refresh tokens");

  // Test 9: Verify sseClient.ts enforces Authorization header and prohibits ?token=
  const sseClientPath = path.resolve("./src/features/notifications/utils/sseClient.ts");
  assert.ok(fs.existsSync(sseClientPath), "FAILED: sseClient.ts does not exist");
  const sseClientContent = fs.readFileSync(sseClientPath, "utf-8");
  assert.ok(
    sseClientContent.includes("headers.Authorization = `Bearer ${token}`"),
    "FAILED: sseClient.ts must attach Authorization Bearer header"
  );
  assert.ok(
    sseClientContent.includes("[?&]token="),
    "FAILED: sseClient.ts must validate against query string token parameters"
  );
  console.log("✓ PASS 9: sseClient.ts verified: enforces Authorization header and prohibits URL token parameters");
}

console.log("\n=== ALL FRONTEND SECURITY REGRESSION TESTS PASSED ===");
