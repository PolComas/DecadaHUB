# Flux 04: Ingesta de transcripts

## Objectiu

Llegir transcripts guardats a Google Docs o Word dins Google Drive i vincular-los a una reunió i a un client.

## Trigger

Opció MVP:
- `Schedule Trigger` cada hora sobre una carpeta concreta de Drive.

Opció millor:
- `Google Drive Trigger` si el teu entorn d'n8n el suporta bé.

## Nodes

1. `Google Drive - List files in folder`
   Carpeta recomanada: una única carpeta on l'equip deixa els transcripts.

2. `IF - New or updated file?`
   Comprova contra `transcripts.drive_file_id` o `external_document_id`.

3. `Switch - File type`
   Casos principals:
   - Google Doc
   - DOCX

4. `Google Docs - Get document text`
   Per Google Docs.

5. `Google Drive - Download file`
   Per DOCX.

6. `Code - Extract plain text`
   Converteix DOCX a text net si cal i normalitza salts de línia.

7. `Code - Resolve meeting`
   Intenta trobar la reunió per:
   - nom del fitxer
   - data del fitxer
   - assistents mencionats
   - proximitat temporal amb `meetings`

8. `Postgres - Upsert transcript`
   Escriu a `transcripts`:
   - `meeting_id`
   - `client_id`
   - `source_type`
   - `file_name`
   - `document_url`
   - `content_text`

9. `Postgres - Queue AI work`
   Marca el transcript com pendent d'anàlisi.

## Notes

- Si ara mateix els transcripts no segueixen cap naming convention, és un punt a arreglar amb el client.
- La millor convenció és: `YYYY-MM-DD__NomClient__MeetingTitle`.
