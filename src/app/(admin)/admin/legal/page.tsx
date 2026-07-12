import { getAllLegalDocumentsForAdminAction } from '@/app/actions/legal'
import { LegalDocumentsManager } from '@/components/admin/legal-documents-manager'

export default async function AdminLegalPage() {
    const documents = await getAllLegalDocumentsForAdminAction()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Legal Pages</h1>
                <p className="text-gray-400">
                    Edit the Privacy Policy and Terms of Service shown at /privacy and /terms. Set a Global version
                    for everyone, and optionally override it per user type.
                </p>
            </div>

            <LegalDocumentsManager initialDocuments={documents} />
        </div>
    )
}
