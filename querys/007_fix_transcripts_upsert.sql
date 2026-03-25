drop index if exists public.transcripts_drive_file_unique_idx;
drop index if exists public.transcripts_external_doc_unique_idx;

create unique index if not exists transcripts_drive_file_unique_idx
  on public.transcripts (source_type, drive_file_id);

create unique index if not exists transcripts_external_doc_unique_idx
  on public.transcripts (source_type, external_document_id);
