
export default function SettingsPage() {
  return (
    <>
        <div className="space-y-6 mt-[2vh] p-6 bg-white rounded-md">
<div>
            <h2 className="text-2xl font-bold text-zinc-900">Settings</h2>
            <p className="mt-1 text-sm text-zinc-600">
            Configure application settings
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Settings */}
            <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-zinc-900">
                Company Information
                </h3>
                <div className="mt-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-700">
                    Company Name
                    </label>
                    <input
                    type="text"
                    className="payroll-input mt-1"
                    placeholder="Your company name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700">
                    Address
                    </label>
                    <textarea
                    className="payroll-input mt-1 resize-none"
                    rows={3}
                    placeholder="Company address"
                    />
                </div>
                <button className="payroll-button">
                    Save
                </button>
                </div>
            </div>
            </div>

            {/* Payroll Settings */}
            <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-zinc-900">
                Payroll Settings
                </h3>
                <div className="mt-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-700">
                    NSSF Rate (%)
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    className="payroll-input mt-1"
                    defaultValue="6"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700">
                    NSSF Max Contribution (KES)
                    </label>
                    <input
                    type="number"
                    className="payroll-input mt-1"
                    defaultValue="4320"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700">
                    SHIF Rate (%)
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    className="payroll-input mt-1"
                    defaultValue="2.75"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-700">
                    Housing Levy Rate (%)
                    </label>
                    <input
                    type="number"
                    step="0.01"
                    className="payroll-input mt-1"
                    defaultValue="1.5"
                    />
                </div>
                <button className="payroll-button">
                    Save
                </button>
                </div>
            </div>
            </div>
        </div>
        </div>
    </>
  )
}
