/** Exactly what AI features send, in plain words. Shown before AI is turned on. */
export default function AiExplainer() {
  return (
    <div className="space-y-4 text-[15px]">
      <p>Ballast's AI is off until you turn it on. It's a quiet guide, not a chatbot: short, specific, and always optional. Everything it says draws only on Ballast's Library cards and your own words, and it shows you which cards it used.</p>
      <div>
        <p className="font-medium">What is sent, and only when a feature runs</p>
        <p className="mt-1 text-muted">From this device, through Ballast's server, to Anthropic's Claude API:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><span className="font-medium">Bearing</span> (once a day): the value you carry today and its definition, your other values, and which quadrant today's dials land in.</li>
          <li><span className="font-medium">Weekly reflection</span>: that week's dials, entries, Sails and evidence lines, and your values.</li>
          <li><span className="font-medium">Ask Ballast</span>: your question, your values, and the last seven days of dials, evidence lines and Sails.</li>
          <li><span className="font-medium">Season review</span>: that season's numbers, your values and your evidence lines.</li>
          <li><span className="font-medium">Practice pick</span>: dials and practice names only. <span className="font-medium">Thank-you drafts</span>: what you wrote about that person.</li>
        </ul>
      </div>
      <p className="text-muted">Never sent: your email, your account details, or days a feature doesn't need. Ballast has no analytics, so your words aren't counted or tracked anywhere.</p>
      <p className="text-muted">What the AI writes is kept on this device (and in your account if you sync), is included when you export, and is deleted with your data. Turning AI off stops all of it straight away.</p>
    </div>
  );
}
