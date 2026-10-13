import { useMemo, useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clinicalDepartments,
  departmentForCategory,
  type ClinicalTariff,
  testsForDepartment,
} from "@/lib/clinical-menu";
import { formFieldLabels, sectionFromDepartmentTitle } from "@/lib/akili-forms";
import {
  packagingAccentClass,
  packagingForSampleType,
  sampleFromSampleType,
  samples,
  sampleTypesForSample,
} from "@/lib/sample-packaging";
import { submitEnquiry } from "@/lib/submit-enquiry";
import { cn } from "@/lib/utils";

type Variant = "quote" | "collection" | "contact" | "booking";

const labels: Record<Variant, { title: string; cta: string; done: string; notesPlaceholder: string }> = {
  quote: {
    title: "Quote request",
    cta: "Submit quote request",
    done: "Your quote request has been received. Our sales team will follow up with pricing and lead times.",
    notesPlaceholder: "Models, quantities, delivery site, install needs",
  },
  collection: {
    title: "Demo or delivery request",
    cta: "Request demo / delivery",
    done: "Your request has been received. Our sales team will confirm availability and next steps by phone.",
    notesPlaceholder: "Delivery site, access notes, preferred window",
  },
  contact: {
    title: "Send us a message",
    cta: "Send message",
    done: "Thank you - your message has reached the AKILI LABS sales team.",
    notesPlaceholder: "How can we help?",
  },
  booking: {
    title: "Book a lab test",
    cta: "Submit booking request",
    done: "Your test booking request has been received. We will confirm the appointment and any preparation notes.",
    notesPlaceholder: "Prep questions, courier drop-off time, ward notes",
  },
};

const sexOptions = ["Female", "Male", "Other", "Prefer not to say"] as const;

export function RequestForm({
  variant = "quote",
  options = [],
  optionLabel = "Product line",
  defaultOption = "",
  tests = [],
}: {
  variant?: Variant;
  options?: string[];
  optionLabel?: string;
  defaultOption?: string;
  /** Published clinical tariffs — used on booking to drive test + sample fields. */
  tests?: ClinicalTariff[];
}) {
  const [submitted, setSubmitted] = useState(false);
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [reference, setReference] = useState("");
  const [option, setOption] = useState(defaultOption);
  const [testCode, setTestCode] = useState("");
  const [testQuery, setTestQuery] = useState("");
  const [sample, setSample] = useState<string>("Other / not sure");
  const [sampleType, setSampleType] = useState("As advised by lab");
  const [sex, setSex] = useState("");
  const copy = labels[variant];
  const isBooking = variant === "booking";

  const departmentTests = useMemo(() => {
    if (!isBooking || tests.length === 0) return [] as ClinicalTariff[];
    const dept = clinicalDepartments.find((item) => item.title === option);
    if (!dept) return tests;
    return testsForDepartment(tests, dept.id);
  }, [isBooking, tests, option]);

  const visibleTests = useMemo(() => {
    if (!isBooking) return [] as ClinicalTariff[];
    const needle = testQuery.trim().toLowerCase();
    const pool = needle ? tests : departmentTests;
    if (!needle) return pool;
    return pool.filter(
      (test) =>
        test.code.toLowerCase().includes(needle) ||
        test.name.toLowerCase().includes(needle) ||
        test.category.toLowerCase().includes(needle),
    );
  }, [isBooking, tests, departmentTests, testQuery]);

  const sampleTypeOptions = useMemo(() => {
    const fromSample = sampleTypesForSample(sample);
    // Keep the current value visible if a test pre-filled a type outside this sample's list
    if (sampleType && !fromSample.includes(sampleType)) {
      return [...fromSample, sampleType];
    }
    return fromSample;
  }, [sample, sampleType]);

  const packaging = packagingForSampleType(sampleType);

  function applyTest(code: string) {
    setTestCode(code);
    const selected = tests.find((test) => test.code === code);
    if (!selected) return;
    const nextSampleType = selected.sampleType?.trim() || "As advised by lab";
    setSampleType(nextSampleType);
    setSample(sampleFromSampleType(nextSampleType));
    const dept = departmentForCategory(selected.category);
    if (dept) setOption(dept.title);
    setTestQuery("");
  }

  function onDepartmentChange(value: string) {
    setOption(value);
    setTestCode("");
    setTestQuery("");
    setSampleType("As advised by lab");
    setSample("Other / not sure");
  }

  function onSampleChange(value: string) {
    setSample(value);
    const options = sampleTypesForSample(value);
    if (!options.includes(sampleType)) {
      setSampleType(options[0] ?? "As advised by lab");
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consent) {
      toast.error("Please confirm consent to be contacted about this request.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const selectedTest = tests.find((test) => test.code === testCode);

    setPending(true);
    try {
      const result = await submitEnquiry({
        data: {
          variant,
          fullName: String(formData.get("fullName") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          email: String(formData.get("email") ?? ""),
          orgName: String(formData.get("orgName") ?? ""),
          option,
          preferredDate: String(formData.get("preferredDate") ?? ""),
          address: String(formData.get("address") ?? ""),
          notes: String(formData.get("notes") ?? ""),
          age: String(formData.get("age") ?? ""),
          sex,
          testCode: selectedTest?.code ?? testCode,
          testName: selectedTest?.name ?? "",
          sample,
          sampleType,
          patientNumber: String(formData.get("patientNumber") ?? ""),
          requestingDoctor: String(formData.get("requestingDoctor") ?? ""),
          broughtBy: String(formData.get("broughtBy") ?? ""),
          sponsor: String(formData.get("sponsor") ?? ""),
          ward: String(formData.get("ward") ?? ""),
          dateCollected: String(formData.get("dateCollected") ?? ""),
          section: sectionFromDepartmentTitle(option) ?? "",
        },
      });

      setReference(result.reference);
      setSubmitted(true);
      toast.success("Request received — our team will follow up");
    } catch (error) {
      console.error(error);
      toast.error("Could not submit the request. Please try again or email sales directly.");
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-sm border border-border bg-card p-8 text-center shadow-card">
        <CheckCircle2 className="mx-auto size-10 text-accent" aria-hidden />
        <h3 className="mt-4 text-xl font-semibold">Request received</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{copy.done}</p>
        <p className="mt-4 text-xs text-muted-foreground">Reference {reference}</p>
        <p className="mx-auto mt-2 max-w-sm text-xs text-muted-foreground">
          We will contact you on the phone or email you provided.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => setSubmitted(false)}>
          Submit another request
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-sm border border-border bg-card p-6 shadow-card md:p-8"
      noValidate={false}
    >
      <h3 className="font-display text-xl font-semibold">{copy.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {isBooking
          ? "Tell us about the patient and the test you need. We will confirm the appointment and any preparation notes."
          : "Share a few details and our team will follow up by phone or email."}
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="fullName">{isBooking ? formFieldLabels.patientName : "Full name"}</Label>
          <Input id="fullName" name="fullName" required autoComplete="name" />
        </div>

        {isBooking ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="patientNumber">{formFieldLabels.patientNumber}</Label>
              <Input id="patientNumber" name="patientNumber" placeholder="Hospital / clinic MR no." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="age">{formFieldLabels.age}</Label>
              <Input
                id="age"
                name="age"
                type="number"
                min={0}
                max={120}
                inputMode="numeric"
                required
                placeholder="Years"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sex">{formFieldLabels.sex}</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger id="sex">
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  {sexOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ward">{formFieldLabels.ward}</Label>
              <Input id="ward" name="ward" placeholder="Optional" />
            </div>
          </>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="phone">{isBooking ? formFieldLabels.contactNumber : "Mobile number"}</Label>
          <Input id="phone" name="phone" type="tel" required autoComplete="tel" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="orgName">
            {isBooking ? formFieldLabels.receivedFrom : "Organisation (optional)"}
          </Label>
          <Input
            id="orgName"
            name="orgName"
            autoComplete="organization"
            placeholder={isBooking ? "Clinic / hospital" : undefined}
          />
        </div>

        {isBooking ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="requestingDoctor">{formFieldLabels.requestingDoctor}</Label>
              <Input id="requestingDoctor" name="requestingDoctor" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="broughtBy">{formFieldLabels.broughtBy}</Label>
              <Input id="broughtBy" name="broughtBy" placeholder="Who is delivering the sample" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sponsor">{formFieldLabels.sponsor}</Label>
              <Input id="sponsor" name="sponsor" placeholder="Optional" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dateCollected">{formFieldLabels.dateCollected}</Label>
              <Input id="dateCollected" name="dateCollected" type="date" />
            </div>
          </>
        ) : null}

        {options.length > 0 && (
          <div className="grid gap-2">
            <Label htmlFor="option">{optionLabel}</Label>
            <Select value={option} onValueChange={isBooking ? onDepartmentChange : setOption}>
              <SelectTrigger id="option">
                <SelectValue placeholder={`Select ${optionLabel.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isBooking ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="test">{formFieldLabels.testsRequested}</Label>
              <Input
                id="test-search"
                value={testQuery}
                onChange={(event) => setTestQuery(event.target.value)}
                placeholder="Search all tests by name or code…"
                className="bg-background"
                aria-label="Search tests"
              />
              <Select
                value={testCode || undefined}
                onValueChange={applyTest}
                disabled={visibleTests.length === 0 && !testCode}
              >
                <SelectTrigger id="test">
                  <SelectValue
                    placeholder={
                      visibleTests.length === 0
                        ? testQuery.trim()
                          ? "No tests match your search"
                          : "No published tests in this department"
                        : testQuery.trim()
                          ? `Select from ${visibleTests.length} matching tests`
                          : "Select test"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {visibleTests.map((test) => (
                    <SelectItem key={test.code} value={test.code}>
                      {test.code} · {test.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {testQuery.trim()
                  ? "Searching across all departments"
                  : "Browse by department above, or search to find any test"}
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sample">Sample</Label>
              <Select value={sample} onValueChange={onSampleChange}>
                <SelectTrigger id="sample">
                  <SelectValue placeholder="Select sample" />
                </SelectTrigger>
                <SelectContent>
                  {samples.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Specimen material (e.g. Blood, Urine)</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sampleType">Sample type</Label>
              <Select value={sampleType} onValueChange={setSampleType}>
                <SelectTrigger id="sampleType">
                  <SelectValue placeholder="Select sample type" />
                </SelectTrigger>
                <SelectContent>
                  {sampleTypeOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Preparation / fraction (e.g. Whole blood, Plasma, Serum)
              </p>
            </div>

            <div
              className={cn(
                "sm:col-span-2 flex gap-3 rounded-sm border px-4 py-3 text-sm",
                packagingAccentClass[packaging.accent],
              )}
              role="note"
            >
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div>
                <p className="font-medium">{packaging.tubeLabel}</p>
                <p className="mt-1 text-xs leading-relaxed opacity-90">{packaging.tip}</p>
              </div>
            </div>
          </>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="preferredDate">
            {isBooking ? "Preferred appointment / drop-off date" : "Preferred contact date"}
          </Label>
          <Input id="preferredDate" name="preferredDate" type="date" />
        </div>

        {variant === "collection" && (
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="address">Delivery or demo address</Label>
            <Input id="address" name="address" required autoComplete="street-address" />
          </div>
        )}

        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="notes">Notes for our team</Label>
          <Textarea
            id="notes"
            name="notes"
            rows={4}
            placeholder={copy.notesPlaceholder}
          />
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-sm bg-muted p-4">
        <Checkbox
          id="consent"
          checked={consent}
          onCheckedChange={(value) => setConsent(value === true)}
        />
        <Label htmlFor="consent" className="text-xs leading-relaxed font-normal text-muted-foreground">
          I consent to AKILI LABS contacting me about this request and processing my contact
          details in line with the{" "}
          <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
            privacy policy
          </Link>
          .
        </Label>
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-6 w-full"
        disabled={pending || (isBooking && !sex)}
      >
        {pending ? "Sending…" : copy.cta}
      </Button>

      <p className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="size-4" aria-hidden />
        Encrypted in transit · Handled confidentially by our team
      </p>
    </form>
  );
}
