"use client";

import { useEffect, useState } from "react";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type User = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "broker" | "admin";
  companyName?: string;
};

type Enquiry = {
  _id: string;
  companyName: string;
  industry: string;
  insuranceType: string;
  status: string;
  createdAt: string;
  riskAssessment?: string;
  customer?: {
    name: string;
    email: string;
  };
  quotation?: {
    insurer?: string;
    indicativePremium?: string;
    coverageLimit?: string;
    terms?: string;
  };
};

type Quote = {
  insurer: string;
  indicativePremium: string;
  coverageLimit: string;
  terms: string;
};

export default function Home() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [mode, setMode] = useState<"login" | "register">("register");
  const [showAuth, setShowAuth] = useState(false);

  const [message, setMessage] = useState("");
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
const [summary, setSummary] =
  useState<Record<string, number> | null>(null);

const [adminOverview, setAdminOverview] =
  useState<Record<string, number> | null>(null);

const [adminUsers, setAdminUsers] = useState<any[]>([]);
const [adminQuotations, setAdminQuotations] = useState<Enquiry[]>([]);
const [adminTab, setAdminTab] = useState("overview");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: "",
    companyName: "",
    phone: "",
  });

  const [form, setForm] = useState({
    companyName: "",
    industry: "",
    employeeCount: "1",
    annualRevenue: "",
    country: "India",
    insuranceType: "D&O",
    coverageNotes: "",
  });

  const [quote, setQuote] = useState<Record<string, Quote>>({});

  async function request(
    path: string,
    options: RequestInit = {},
    authToken = token
  ) {
    const response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authToken
          ? { Authorization: `Bearer ${authToken}` }
          : {}),
        ...(options.headers || {}),
      },
    });

    const data = await response
      .json()
      .catch(() => ({ message: "Unexpected server response" }));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }

  async function loadDashboard(t = token, u = user) {
  if (!t || !u) return;

  try {
    const headers = {
      Authorization: `Bearer ${t}`,
    };

    if (u.role === "customer") {
      const response = await fetch(`${API}/enquiries/mine`, {
        headers,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      setEnquiries(data.enquiries || []);
    } 

    else if (u.role === "broker") {
      const [response, summaryResponse] = await Promise.all([
        fetch(`${API}/enquiries`, { headers }),
        fetch(`${API}/dashboard/summary`, { headers }),
      ]);

      const data = await response.json();
      const summaryData = await summaryResponse.json();

      if (!response.ok) throw new Error(data.message);
      if (!summaryResponse.ok) throw new Error(summaryData.message);

      setEnquiries(data.enquiries || []);
      setSummary(summaryData);
    } 

    else if (u.role === "admin") {
      const [overviewRes, usersRes, enquiriesRes, quotationsRes] =
        await Promise.all([
          fetch(`${API}/admin/overview`, { headers }),
          fetch(`${API}/admin/users`, { headers }),
          fetch(`${API}/admin/enquiries`, { headers }),
          fetch(`${API}/admin/quotations`, { headers }),
        ]);

      const overview = await overviewRes.json();
      const users = await usersRes.json();
      const enquiries = await enquiriesRes.json();
      const quotations = await quotationsRes.json();

      if (!overviewRes.ok) throw new Error(overview.message);
      if (!usersRes.ok) throw new Error(users.message);
      if (!enquiriesRes.ok) throw new Error(enquiries.message);
      if (!quotationsRes.ok) throw new Error(quotations.message);

      setAdminOverview(overview);
      setAdminUsers(users.users || []);
      setEnquiries(enquiries.enquiries || []);
      setAdminQuotations(quotations.quotations || []);
    }
  } catch (e) {
    setMessage(
      e instanceof Error ? e.message : "Could not load dashboard"
    );
  }
}
  useEffect(() => {
    const saved = localStorage.getItem("coverbridge_token");
    const savedUser = localStorage.getItem("coverbridge_user");

    if (saved && savedUser) {
      try {
        const u = JSON.parse(savedUser) as User;

        setToken(saved);
        setUser(u);
        loadDashboard(saved, u);
      } catch {
        localStorage.removeItem("coverbridge_token");
        localStorage.removeItem("coverbridge_user");
      }
    }
  }, []);

  async function authenticate(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    try {
      const data = await request(
        `/auth/${mode}`,
        {
          method: "POST",
          body: JSON.stringify(authForm),
        },
        ""
      );

      setToken(data.token);
      setUser(data.user);

      localStorage.setItem("coverbridge_token", data.token);
      localStorage.setItem(
        "coverbridge_user",
        JSON.stringify(data.user)
      );

      setShowAuth(false);
      setMessage("Welcome to CoverBridge.");

      loadDashboard(data.token, data.user);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Authentication failed"
      );
    }
  }

  async function createEnquiry(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    try {
      await request("/enquiries", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          employeeCount: Number(form.employeeCount),
        }),
      });

      setMessage("Enquiry submitted successfully.");

      setForm({
        ...form,
        companyName: "",
        industry: "",
        coverageNotes: "",
      });

      loadDashboard();
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Could not submit enquiry"
      );
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await request(`/enquiries/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setMessage("Enquiry status updated.");
      loadDashboard();
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Could not update status"
      );
    }
  }

  async function saveQuote(id: string) {
    try {
      await request(`/enquiries/${id}/quotation`, {
        method: "PUT",
        body: JSON.stringify(quote[id] || {}),
      });

      setMessage("Quotation saved.");
      loadDashboard();
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "Could not save quotation"
      );
    }
  }

  function logout() {
    localStorage.removeItem("coverbridge_token");
    localStorage.removeItem("coverbridge_user");

    setToken("");
    setUser(null);
    setEnquiries([]);
    setSummary(null);
    setQuote({});
    setMessage("");
    setShowAuth(false);
    setMode("register");
  }

  // CUSTOMER ONBOARDING LANDING PAGE

  if (!user && !showAuth) {
    return (
      <main className="landingPage">
        <nav className="landingNav">
          <div className="brand">
            <span className="brandMark">C</span>

            <span>
              CoverBridge
              <small>COMMERCIAL INSURANCE</small>
            </span>
          </div>

          <div className="navActions">
            <button
              className="linkButton"
              onClick={() => {
                setMode("login");
                setShowAuth(true);
              }}
            >
              Sign In
            </button>

            <button
              className="primary"
              onClick={() => {
                setMode("register");
                setShowAuth(true);
              }}
            >
              Get Started
            </button>
          </div>
        </nav>

        <section className="landingHero">
          <div className="landingHeroContent">
            <span className="eyebrow">
              COMMERCIAL INSURANCE, SIMPLIFIED
            </span>

            <h1>
              Protect Your Business.
              <br />
              <span>Focus on Growth.</span>
            </h1>

            <p>
              Discover business insurance solutions with expert
              broker assistance. Submit your requirements, track
              enquiries and receive quotations in one place.
            </p>

            <div className="landingActions">
              <button
                className="primary"
                onClick={() => {
                  setMode("register");
                  setShowAuth(true);
                }}
              >
                Get Started →
              </button>

              <button
                className="outline"
                onClick={() => {
                  setMode("login");
                  setShowAuth(true);
                }}
              >
                Existing Customer? Sign In
              </button>
            </div>

            <div className="heroTags">
              <span>D&O Insurance</span>
              <span>Cyber Liability</span>
              <span>Key-Person Insurance</span>
            </div>
          </div>

          <div className="landingVisual">
            <div className="visualCard">
              <span className="visualIcon">🛡️</span>

              <h3>
                Your business deserves protection.
              </h3>

              <p>
                Manage insurance enquiries and broker
                communication through one simple workspace.
              </p>

              <div className="visualFeature">
                <span>✓</span>
                Business risk assessment
              </div>

              <div className="visualFeature">
                <span>✓</span>
                Broker-assisted quotations
              </div>

              <div className="visualFeature">
                <span>✓</span>
                Enquiry tracking
              </div>
            </div>
          </div>
        </section>

        <section className="landingSection">
          <span className="eyebrow">OUR SOLUTIONS</span>

          <h2>
            Insurance support for growing businesses
          </h2>

          <p className="muted">
            Explore coverage options designed to address
            important business risks.
          </p>

          <div className="featureGrid">
            <article className="featureCard">
              <span className="featureIcon">🏢</span>

              <h3>Directors & Officers</h3>

              <p>
                Explore protection for directors and officers
                against certain management-related claims.
              </p>
            </article>

            <article className="featureCard">
              <span className="featureIcon">🔐</span>

              <h3>Cyber Liability</h3>

              <p>
                Explore insurance options for cyber incidents,
                data breaches and related business risks.
              </p>
            </article>

            <article className="featureCard">
              <span className="featureIcon">👤</span>

              <h3>Key-Person Insurance</h3>

              <p>
                Explore ways to address financial risks associated
                with the loss of a key business individual.
              </p>
            </article>
          </div>
        </section>

        <section className="howSection">
          <span className="eyebrow">SIMPLE PROCESS</span>

          <h2>How CoverBridge works</h2>

          <div className="stepsGrid">
            <article>
              <span className="stepNumber">01</span>

              <h3>Create an account</h3>

              <p>Register your business on CoverBridge.</p>
            </article>

            <article>
              <span className="stepNumber">02</span>

              <h3>Submit requirements</h3>

              <p>
                Share your business details and insurance needs.
              </p>
            </article>

            <article>
              <span className="stepNumber">03</span>

              <h3>Broker review</h3>

              <p>
                A broker reviews your submitted enquiry.
              </p>
            </article>

            <article>
              <span className="stepNumber">04</span>

              <h3>Track quotations</h3>

              <p>
                Follow your enquiry and view available quotations.
              </p>
            </article>
          </div>
        </section>

        <section className="landingCTA">
          <h2>Ready to take the next step?</h2>

          <p>
            Create your business account and submit your
            insurance requirements.
          </p>

          <button
            className="primary"
            onClick={() => {
              setMode("register");
              setShowAuth(true);
            }}
          >
            Create Your Account →
          </button>
        </section>

        <footer className="landingFooter">
          <strong>CoverBridge</strong>

          <p>
            Commercial Insurance Brokerage MVP · For
            broker-assisted enquiries only. Not an insurance
            policy or binding quote.
          </p>
        </footer>
      </main>
    );
  }

  // LOGIN AND REGISTRATION

  if (!user) {
    return (
      <main className="authShell">
        <section className="hero">
          <span className="eyebrow">
            B2B COMMERCIAL INSURANCE
          </span>

          <h1>
            {mode === "register"
              ? "Start protecting your business."
              : "Welcome back to CoverBridge."}
          </h1>

          <p>
            One place for businesses to request D&O, Cyber
            Liability and Key-Person insurance support from a broker.
          </p>

          <div className="heroTags">
            <span>D&O</span>
            <span>Cyber Liability</span>
            <span>Key-Person</span>
          </div>
        </section>

        <form className="panel authPanel" onSubmit={authenticate}>
          <button
            type="button"
            className="linkButton"
            onClick={() => {
              setShowAuth(false);
              setMessage("");
            }}
          >
            ← Back to Home
          </button>

          <h2>
            {mode === "register"
              ? "Create business account"
              : "Welcome back"}
          </h2>

          <p className="muted">
            Access your commercial insurance workspace.
          </p>

          {mode === "register" && (
            <>
              <label>
                Full name

                <input
                  required
                  value={authForm.name}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      name: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Company name

                <input
                  value={authForm.companyName}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      companyName: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Phone

                <input
                  value={authForm.phone}
                  onChange={(e) =>
                    setAuthForm({
                      ...authForm,
                      phone: e.target.value,
                    })
                  }
                />
              </label>
            </>
          )}

          <label>
            Email

            <input
              required
              type="email"
              value={authForm.email}
              onChange={(e) =>
                setAuthForm({
                  ...authForm,
                  email: e.target.value,
                })
              }
            />
          </label>

          <label>
            Password

            <input
              required
              minLength={8}
              type="password"
              value={authForm.password}
              onChange={(e) =>
                setAuthForm({
                  ...authForm,
                  password: e.target.value,
                })
              }
            />
          </label>

          <button className="primary">
            {mode === "register"
              ? "Create account"
              : "Sign in"}
          </button>

          <button
            type="button"
            className="linkButton"
            onClick={() =>
              setMode(
                mode === "register" ? "login" : "register"
              )
            }
          >
            {mode === "register"
              ? "Already registered? Sign in"
              : "New here? Create account"}
          </button>

          {message && (
            <p className="notice">{message}</p>
          )}
        </form>
      </main>
    );
  }

  // LOGGED-IN DASHBOARD

  return (
    <main className="appShell">
      <header className="topbar">
        <div className="brand">
          <span className="brandMark">C</span>

          <span>
            CoverBridge
            <small>COMMERCIAL INSURANCE</small>
          </span>
        </div>

        <div className="userArea">
          <span>
            {user.name} · {user.role}
          </span>

          <button className="outline" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <section className="welcome">
        <div>
          <span className="eyebrow">YOUR WORKSPACE</span>

          <h1>
            {user.role === "customer"
              ? "Business insurance workspace"
              : user.role === "broker"
              ? "Broker operations"
              : "Platform overview"}
          </h1>

          <p className="muted">
            {user.companyName ||
              "Manage enquiries, documents and quotations in one place."}
          </p>
        </div>
      </section>

      {message && (
        <div className="notice globalNotice">
          {message}
        </div>
      )}

      {user.role === "customer" && (
        <section className="contentGrid">
          <form className="panel" onSubmit={createEnquiry}>
            <h2>Request insurance support</h2>

            <p className="muted">
              Share your requirements. A broker will review
              your enquiry.
            </p>

            <label>
              Company name

              <input
                required
                value={form.companyName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    companyName: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Industry

              <input
                required
                value={form.industry}
                onChange={(e) =>
                  setForm({
                    ...form,
                    industry: e.target.value,
                  })
                }
              />
            </label>

            <div className="twoCol">
              <label>
                Employees

                <input
                  type="number"
                  min="1"
                  value={form.employeeCount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      employeeCount: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Annual revenue

                <input
                  placeholder="e.g. ₹5 crore"
                  value={form.annualRevenue}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      annualRevenue: e.target.value,
                    })
                  }
                />
              </label>
            </div>

            <label>
              Country

              <input
                value={form.country}
                onChange={(e) =>
                  setForm({
                    ...form,
                    country: e.target.value,
                  })
                }
              />
            </label>

            <label>
              Insurance product

              <select
                value={form.insuranceType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    insuranceType: e.target.value,
                  })
                }
              >
                <option>D&O</option>
                <option>Cyber Liability</option>
                <option>Key-Person</option>
              </select>
            </label>

            <label>
              Requirements / context

              <textarea
                rows={4}
                value={form.coverageNotes}
                onChange={(e) =>
                  setForm({
                    ...form,
                    coverageNotes: e.target.value,
                  })
                }
              />
            </label>

            <button className="primary">
              Submit enquiry
            </button>
          </form>

          <section className="panel">
            <h2>My enquiries</h2>

            <p className="muted">
              Track review progress and quotations.
            </p>

            <EnquiryList items={enquiries} />
          </section>
        </section>
      )}

            
      {user.role === "broker" && (
        <>
          <section className="stats">
            {Object.entries(summary || {}).map(([key, value]) => (
              <div className="stat panel" key={key}>
                <span>{key.replace(/[A-Z]/g, " $&")}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </section>

          <section className="panel">
            <h2>Enquiry pipeline</h2>
            <p className="muted">
              Review customer requests and manage broker responses.
            </p>

            <EnquiryList
              items={enquiries}
              broker
              quote={quote}
              setQuote={setQuote}
              updateStatus={updateStatus}
              saveQuote={saveQuote}
            />
          </section>
        </>
      )}

      {user.role === "admin" && (
        <>
          <section className="panel">
            <h2>Admin Control Center</h2>
            <p className="muted">
              Monitor users, customers, brokers, enquiries and quotations.
            </p>

            <div className="adminTabs">
              {[
                { id: "overview", label: "Overview" },
                { id: "users", label: "All Users" },
                { id: "customers", label: "Customers" },
                { id: "brokers", label: "Brokers" },
                { id: "enquiries", label: "Enquiries" },
                { id: "quotations", label: "Quotations" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={adminTab === tab.id ? "primary small" : "outline"}
                  onClick={() => setAdminTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </section>

          {adminTab === "overview" && (
            <>
              <section className="stats">
                {Object.entries(adminOverview || {}).map(([key, value]) => (
                  <div className="stat panel" key={key}>
                    <span>{key.replace(/[A-Z]/g, " $&")}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </section>

              <section className="panel">
                <h2>Recent Enquiries</h2>
                <EnquiryList items={enquiries.slice(0, 5)} />
              </section>
            </>
          )}

          {adminTab === "users" && (
            <section className="panel">
              <h2>All Registered Users</h2>
              <p className="muted">Complete list of platform accounts.</p>

              {adminUsers.length === 0 ? (
                <p className="empty">No users found.</p>
              ) : (
                <div className="enquiryList">
                  {adminUsers.map((person) => (
                    <article className="enquiry" key={person._id || person.id}>
                      <h3>{person.name}</h3>
                      <p className="muted">{person.email}</p>
                      <p>Role: <strong>{person.role}</strong></p>
                      <p>Company: {person.companyName || "Not provided"}</p>
                      <p>Phone: {person.phone || "Not provided"}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {adminTab === "customers" && (
            <section className="panel">
              <h2>Customers</h2>
              <div className="enquiryList">
                {adminUsers.filter((person) => person.role === "customer").map((person) => (
                  <article className="enquiry" key={person._id || person.id}>
                    <h3>{person.name}</h3>
                    <p className="muted">{person.email}</p>
                    <p>Company: {person.companyName || "Not provided"}</p>
                    <p>Phone: {person.phone || "Not provided"}</p>
                  </article>
                ))}
                {adminUsers.filter((person) => person.role === "customer").length === 0 && (
                  <p className="empty">No customers found.</p>
                )}
              </div>
            </section>
          )}

          {adminTab === "brokers" && (
            <section className="panel">
              <h2>Registered Brokers</h2>
              <div className="enquiryList">
                {adminUsers.filter((person) => person.role === "broker").map((person) => (
                  <article className="enquiry" key={person._id || person.id}>
                    <h3>{person.name}</h3>
                    <p className="muted">{person.email}</p>
                    <p>Company: {person.companyName || "Not provided"}</p>
                    <p>Phone: {person.phone || "Not provided"}</p>
                  </article>
                ))}
                {adminUsers.filter((person) => person.role === "broker").length === 0 && (
                  <p className="empty">No brokers found.</p>
                )}
              </div>
            </section>
          )}

          {adminTab === "enquiries" && (
            <section className="panel">
              <h2>All Customer Enquiries</h2>
              <EnquiryList items={enquiries} />
            </section>
          )}

          {adminTab === "quotations" && (
            <section className="panel">
              <h2>All Quotations</h2>
              <EnquiryList items={adminQuotations} />
            </section>
          )}
        </>
      )}


      <footer>
        CoverBridge MVP · For broker-assisted enquiries only ·
        Not an insurance policy or binding quote
      </footer>
    </main>
  );
}

// ENQUIRY LIST COMPONENT

function EnquiryList({
  items,
  broker,
  quote,
  setQuote,
  updateStatus,
  saveQuote,
}: {
  items: Enquiry[];
  broker?: boolean;
  quote?: Record<string, Quote>;
  setQuote?: (v: Record<string, Quote>) => void;
  updateStatus?: (id: string, s: string) => void;
  saveQuote?: (id: string) => void;
}) {
  if (!items.length) {
    return (
      <div className="empty">
        No enquiries yet.
      </div>
    );
  }

  return (
    <div className="enquiryList">
      {items.map((item) => (
        <article className="enquiry" key={item._id}>
          <div className="enquiryHead">
            <div>
              <span className="productTag">
                {item.insuranceType}
              </span>

              <h3>{item.companyName}</h3>

              <p className="muted">
                {item.industry} ·{" "}
                {new Date(item.createdAt).toLocaleDateString()}
              </p>

              {item.customer && (
                <p className="muted">
                  Contact: {item.customer.name} (
                  {item.customer.email})
                </p>
              )}
            </div>

            <span className={`status ${item.status}`}>
              {item.status.replace("_", " ")}
            </span>
          </div>

          {item.riskAssessment && (
            <p className="risk">
              {item.riskAssessment}
            </p>
          )}

          {item.quotation?.insurer && (
            <div className="quoteView">
              <b>{item.quotation.insurer}</b>

              {" · "}Indicative premium:{" "}
              {item.quotation.indicativePremium ||
                "Not provided"}

              {" · "}Limit:{" "}
              {item.quotation.coverageLimit ||
                "Not provided"}

              <p>{item.quotation.terms}</p>
            </div>
          )}

          {broker && (
            <div className="brokerTools">
              <label>
                Status

                <select
                  value={item.status}
                  onChange={(e) =>
                    updateStatus?.(
                      item._id,
                      e.target.value
                    )
                  }
                >
                  <option value="submitted">Submitted</option>
                  <option value="under_review">
                    Under review
                  </option>
                  <option value="quote_ready">
                    Quote ready
                  </option>
                  <option value="closed">Closed</option>
                </select>
              </label>

              <div className="quoteFields">
                <input
                  placeholder="Insurer"
                  value={quote?.[item._id]?.insurer || ""}
                  onChange={(e) =>
                    setQuote?.({
                      ...quote,
                      [item._id]: {
                        insurer: e.target.value,
                        indicativePremium:
                          quote?.[item._id]
                            ?.indicativePremium || "",
                        coverageLimit:
                          quote?.[item._id]
                            ?.coverageLimit || "",
                        terms:
                          quote?.[item._id]?.terms || "",
                      },
                    })
                  }
                />

                <input
                  placeholder="Indicative premium"
                  value={
                    quote?.[item._id]?.indicativePremium || ""
                  }
                  onChange={(e) =>
                    setQuote?.({
                      ...quote,
                      [item._id]: {
                        insurer:
                          quote?.[item._id]?.insurer || "",
                        indicativePremium: e.target.value,
                        coverageLimit:
                          quote?.[item._id]
                            ?.coverageLimit || "",
                        terms:
                          quote?.[item._id]?.terms || "",
                      },
                    })
                  }
                />

                <input
                  placeholder="Coverage limit"
                  value={
                    quote?.[item._id]?.coverageLimit || ""
                  }
                  onChange={(e) =>
                    setQuote?.({
                      ...quote,
                      [item._id]: {
                        insurer:
                          quote?.[item._id]?.insurer || "",
                        indicativePremium:
                          quote?.[item._id]
                            ?.indicativePremium || "",
                        coverageLimit: e.target.value,
                        terms:
                          quote?.[item._id]?.terms || "",
                      },
                    })
                  }
                />

                <input
                  placeholder="Terms / notes"
                  value={quote?.[item._id]?.terms || ""}
                  onChange={(e) =>
                    setQuote?.({
                      ...quote,
                      [item._id]: {
                        insurer:
                          quote?.[item._id]?.insurer || "",
                        indicativePremium:
                          quote?.[item._id]
                            ?.indicativePremium || "",
                        coverageLimit:
                          quote?.[item._id]
                            ?.coverageLimit || "",
                        terms: e.target.value,
                      },
                    })
                  }
                />
              </div>

              <button
                type="button"
                className="primary small"
                onClick={() => saveQuote?.(item._id)}
              >
                Save quotation
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
