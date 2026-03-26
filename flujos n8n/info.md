{
  "nodes": [
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT '{{ $json.id }}' AS drive_file_id, EXISTS(SELECT 1 FROM transcripts WHERE drive_file_id = '{{ $json.id }}') AS already_ingested;",
        "options": {}
      },
      "id": "7db11adc-9582-483f-860c-55d6f88a5853",
      "name": "Check if already ingested",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.5,
      "position": [
        -640,
        -80
      ],
      "credentials": {
        "postgres": {
          "id": "3Kp5Kb17YoxCT3Ll",
          "name": "Postgres Decada"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// Single item from Google Drive Trigger\nconst file = $('Google Drive Trigger').item.json;\nconst existing = $input.item.json;\n\n// Skip if already ingested\nif (existing?.already_ingested === true) return [];\n\nconst name = file.name ?? '';\n\n// Parse Gemini Notes title format:\n// \"Pol <> Cami - 2026/03/24 09:29 CET - Notas de Gemini\"\n// \"[Montex] - Migración - 2026/02/24 11:00 CET - Notas de Gemini\"\nconst geminiMatch = name.match(\n  /^(.+?)\\s*-\\s*(\\d{4})\\/(\\d{2})\\/(\\d{2})\\s+(\\d{2}):(\\d{2})\\s+\\w+\\s*-\\s*Notas de Gemini$/\n);\n\nlet meetingTitle = name;\nlet parsedDate = null;\nlet parsedTimestamp = null;\n\nif (geminiMatch) {\n  meetingTitle = geminiMatch[1].trim();\n  const [, , year, month, day, hour, minute] = geminiMatch;\n  parsedDate = `${year}-${month}-${day}`;\n  parsedTimestamp = `${year}-${month}-${day}T${hour}:${minute}:00+01:00`;\n}\n\nreturn [{\n  json: {\n    drive_file_id: file.id,\n    file_name: name,\n    document_url: file.webViewLink ?? '',\n    modified_time: file.modifiedTime ?? file.createdTime,\n    meeting_title: meetingTitle,\n    parsed_date: parsedDate,\n    parsed_timestamp: parsedTimestamp\n  }\n}];"
      },
      "id": "6cc04314-30a0-45a0-b7c6-0a6b360ef376",
      "name": "Filter ingested + parse title",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        -400,
        -80
      ]
    },
    {
      "parameters": {
        "operation": "get",
        "documentURL": "={{ $json.drive_file_id }}"
      },
      "id": "97143a8e-0330-4495-856a-9bad47dbb835",
      "name": "Google Docs — Get document",
      "type": "n8n-nodes-base.googleDocs",
      "typeVersion": 2,
      "position": [
        -160,
        -80
      ],
      "credentials": {
        "googleDocsOAuth2Api": {
          "id": "vHXEfZEpdRlbB7Ts",
          "name": "Google Docs Pol"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "const meta = $('Filter ingested + parse title').item.json;\nconst doc = $input.item.json;\n\nconst contentText = (doc.content ?? '').trim();\n\nreturn [{ json: { ...meta, content_text: contentText } }];"
      },
      "id": "1dc0b516-71a7-44bc-9dc9-06e796756da3",
      "name": "Extract text",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        80,
        -80
      ]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT\n  COALESCE(sub.meeting_id, NULL) AS meeting_id,\n  COALESCE(sub.client_id, NULL) AS client_id\nFROM (SELECT 1) AS dummy\nLEFT JOIN LATERAL (\n  SELECT m.id AS meeting_id, m.client_id\n  FROM meetings m\n  WHERE m.start_at::date = '{{ $json.parsed_date }}'::date\n  ORDER BY\n    CASE WHEN m.title = '{{ ($json.meeting_title || '').replace(/'/g, \"''\") }}' THEN 0 ELSE 1 END,\n    ABS(EXTRACT(EPOCH FROM (\n      m.start_at - {{ $json.parsed_timestamp ? \"'\" + $json.parsed_timestamp + \"'::timestamptz\" : \"'\" + $json.modified_time + \"'::timestamptz\" }}\n    )))\n  LIMIT 1\n) sub ON true;",
        "options": {}
      },
      "id": "5e9a0fdf-2fb7-4039-aa01-e17f597a8f41",
      "name": "Resolve meeting",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.5,
      "position": [
        320,
        -80
      ],
      "credentials": {
        "postgres": {
          "id": "3Kp5Kb17YoxCT3Ll",
          "name": "Postgres Decada"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "const transcript = $('Extract text').item.json;\nconst meetingRow = $input.item.json;\n\nconst transcriptAt = transcript.parsed_timestamp\n  ? transcript.parsed_timestamp\n  : transcript.modified_time;\n\nreturn [{\n  json: {\n    ...transcript,\n    meeting_id:    meetingRow?.meeting_id ?? null,\n    client_id:     meetingRow?.client_id  ?? null,\n    transcript_at: transcriptAt\n  }\n}];\n\n\n"
      },
      "id": "69757ee1-f47c-45cd-b82b-d5f91a5bed43",
      "name": "Merge meeting_id",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [
        560,
        -80
      ]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO transcripts (\n  meeting_id,\n  client_id,\n  source_type,\n  file_name,\n  document_url,\n  drive_file_id,\n  content_text,\n  transcript_at,\n  language_code\n)\nVALUES (\n  {{ $json.meeting_id ? \"'\" + $json.meeting_id + \"'\" : 'NULL' }},\n  {{ $json.client_id  ? \"'\" + $json.client_id  + \"'\" : 'NULL' }},\n  'google_doc',\n  '{{ ($json.file_name || '').replace(/'/g, \"''\") }}',\n  '{{ ($json.document_url || '').replace(/'/g, \"''\") }}',\n  '{{ $json.drive_file_id }}',\n  '{{ ($json.content_text || '').replace(/'/g, \"''\").substring(0, 500000) }}',\n  {{ $json.transcript_at ? \"'\" + $json.transcript_at + \"'\" : 'NULL' }},\n  'es'\n)\nON CONFLICT (source_type, drive_file_id)\nDO UPDATE SET\n  meeting_id    = COALESCE(transcripts.meeting_id,  EXCLUDED.meeting_id),\n  client_id     = COALESCE(transcripts.client_id,   EXCLUDED.client_id),\n  content_text  = EXCLUDED.content_text,\n  transcript_at = EXCLUDED.transcript_at,\n  language_code = EXCLUDED.language_code\nRETURNING id AS transcript_id, meeting_id, client_id;",
        "options": {}
      },
      "id": "a31511ae-0fe4-48bf-bc15-557f6e004f4d",
      "name": "Upsert transcript",
      "type": "n8n-nodes-base.postgres",
      "typeVersion": 2.5,
      "position": [
        800,
        -80
      ],
      "credentials": {
        "postgres": {
          "id": "3Kp5Kb17YoxCT3Ll",
          "name": "Postgres Decada"
        }
      }
    },
    {
      "parameters": {
        "pollTimes": {
          "item": [
            {
              "mode": "everyMinute"
            }
          ]
        },
        "triggerOn": "specificFolder",
        "folderToWatch": {
          "__rl": true,
          "value": "1cjLoJkElBwmLrbSlQpYdWYfHEJbDtbl0",
          "mode": "list",
          "cachedResultName": "Meet Recordings",
          "cachedResultUrl": "https://drive.google.com/drive/folders/1cjLoJkElBwmLrbSlQpYdWYfHEJbDtbl0"
        },
        "event": "fileCreated",
        "options": {}
      },
      "type": "n8n-nodes-base.googleDriveTrigger",
      "typeVersion": 1,
      "position": [
        -848,
        -80
      ],
      "id": "932f4c27-26ef-455b-b80a-e9f84f8162c2",
      "name": "Google Drive Trigger",
      "credentials": {
        "googleDriveOAuth2Api": {
          "id": "Q61A72rVv6GrxH1H",
          "name": "Google Drive Pol"
        }
      }
    }
  ],
  "connections": {
    "Check if already ingested": {
      "main": [
        [
          {
            "node": "Filter ingested + parse title",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Filter ingested + parse title": {
      "main": [
        [
          {
            "node": "Google Docs — Get document",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Docs — Get document": {
      "main": [
        [
          {
            "node": "Extract text",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extract text": {
      "main": [
        [
          {
            "node": "Resolve meeting",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Resolve meeting": {
      "main": [
        [
          {
            "node": "Merge meeting_id",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Merge meeting_id": {
      "main": [
        [
          {
            "node": "Upsert transcript",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Google Drive Trigger": {
      "main": [
        [
          {
            "node": "Check if already ingested",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {
    "Check if already ingested": [
      {
        "drive_file_id": "1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8",
        "already_ingested": false
      }
    ],
    "Filter ingested + parse title": [
      {
        "drive_file_id": "1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8",
        "file_name": "Revisión HUB Decada - POL CAMI - 2026/03/25 13:00 CET - Notas de Gemini",
        "document_url": "https://docs.google.com/document/d/1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8/edit?usp=drivesdk",
        "modified_time": "2026-03-25T12:20:30.362Z",
        "meeting_title": "Revisión HUB Decada - POL CAMI",
        "parsed_date": "2026-03-25",
        "parsed_timestamp": "2026-03-25T13:00:00+01:00"
      }
    ],
    "Google Docs — Get document": [
      {
        "documentId": "1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8",
        "content": "\nRevisión HUB Decada - POL CAMI\nInvitado  \nArchivos adjuntos \n\n\nResumen\nEl resumen ejecutivo cubre el progreso del desarrollo de flujos de datos con la identificación de desafíos en la captura de transcripciones y el filtrado de correos electrónicos no interesantes.\u000b\u000bImplementación de Flujos de Datos\u000bSe ha avanzado en la implementación de 6 flujos de datos, incluyendo la creación de una base de datos para almacenar correos electrónicos y un flujo adicional para Google Calendar para registrar reuniones. La sincronización de correos entrantes se realiza cada 15 minutos, demostrando la funcionalidad básica de la plataforma.\u000b\u000bProblemas de Transcripción y Filtrado\u000bLa captura de transcripciones de reuniones presenta problemas de ubicación de archivos, lo que impide su procesamiento con el nodo actual. Se identificó la necesidad de refinar el análisis de IA de la satisfacción del cliente y de filtrar correos electrónicos irrelevantes como las confirmaciones de reuniones.\u000b\u000bMejoras de Correo Electrónico y Métricas\u000bLos planes futuros se centran en mejorar el filtrado de correos electrónicos, gestionar los hilos correctamente y extraer insights de las conversaciones. Se ha tomado la decisión de pulir la calidad de los datos y los flujos creados con Claude, enfocándose en la exclusión de correos específicos y la unificación de múltiples dominios de clientes.\n\n\nPróximos pasos\n[Pol Comas Romero] Pulir Flujos: Filtrar correos no interesantes. Revisar estatus de hilos para confirmar cierre.\n[Camila Aguado] Solicitar Accesos: Hablar con Alba para pedir 2 correos electrónicos de clientes. Obtener credenciales para comenzar pruebas reales.\n[Camila Aguado] Alinear Montex: Hablar con Sonia para alinear trabajo pendiente de Montex. Planificar tareas para la próxima semana.\n[Pol Comas Romero] Consultar Prácticas: Preguntar a la universidad sobre la posibilidad de extender las prácticas. Evaluar si se puede hacer como prácticas extracurriculares.\n\n\nDetalles\nProgreso en el Desarrollo de Flujos de Correo Electrónico y Calendario: Pol Comas Romero informó a Camila Aguado sobre el progreso en la implementación de seis flujos de datos en el *hub*, incluida la creación de una base de datos para almacenar correos electrónicos y la sincronización de correos entrantes cada 15 minutos. Se ha implementado un flujo adicional para Google Calendar que recoge eventos y los clasifica por cliente para registrar reuniones.\nDesafíos con la Captura de Transcripciones y Filtrado de Correo Electrónico: Se mencionó que la captura de transcripciones de reuniones presenta problemas, ya que algunas se guardan en la carpeta personal de Pol Comas Romero, mientras que otras se guardan en la carpeta *root*, lo que impide su captura mediante el nodo actual. También se identificó la necesidad de refinar el análisis de la satisfacción del cliente por la IA y de filtrar correos electrónicos considerados \"no interesantes\", como las confirmaciones de reuniones, para mejorar la calidad de los datos.\nMejoras Planificadas en el Procesamiento de Correo Electrónico y Métricas: Se planea mejorar el filtrado de correos electrónicos irrelevantes, gestionar correctamente los hilos (threads) de correo electrónico para asegurar que se guarden con el nombre del *thread*, y extraer *insights* de las conversaciones. Además, se están recopilando métricas clave, como el tiempo de respuesta promedio del equipo y de los clientes, e identificando hilos de correo \"estancados\" (aunque se necesita verificar si estos hilos están cerrados en lugar de simplemente estancados).\nRevisión y Ajuste de Flujos y Mails Descartados: El trabajo se centrará en pulir la calidad de los datos y los flujos creados con Claude, lo que incluye determinar qué correos deben descartarse y cómo, asegurando que no se repitan los datos. También se demostró cómo los correos de entidades específicas (como Fira Barcelona) pueden descartarse, mientras que los correos de múltiples dominios (como Vangreen y Montex) pueden unirse bajo un solo cliente.\nPróximos Pasos con el Cliente y Solicitud de Credenciales: Camila Aguado planea solicitar las credenciales de correo de dos clientes para comenzar las pruebas de clasificación por dominio y poner a prueba la implementación en un entorno real. Se confirmó que tienen el mes de abril para la implementación y los ajustes necesarios.\nCoordinación y Posible Extensión de las Prácticas: Pol Comas Romero viajará y regresará el lunes siguiente. Camila Aguado consultó sobre la posibilidad de extender las prácticas para Pol Comas Romero (posiblemente un par de meses) antes de considerar un acuerdo de contratación, para ganar más claridad. Pol Comas Romero indicó que consultará con la universidad sobre la extensión de las prácticas o si es posible realizar un proceso similar como prácticas \"extracurriculares\".\n\n\nRevisa las notas de Gemini para asegurarte de que sean precisas. Obtén sugerencias y descubre cómo Gemini toma notas\nCómo es la calidad de estas notas específicas? Responde una breve encuesta para darnos tu opinión; por ejemplo, cuán útiles te resultaron las notas.\n"
      }
    ],
    "Extract text": [
      {
        "drive_file_id": "1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8",
        "file_name": "Revisión HUB Decada - POL CAMI - 2026/03/25 13:00 CET - Notas de Gemini",
        "document_url": "https://docs.google.com/document/d/1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8/edit?usp=drivesdk",
        "modified_time": "2026-03-25T12:20:30.362Z",
        "meeting_title": "Revisión HUB Decada - POL CAMI",
        "parsed_date": "2026-03-25",
        "parsed_timestamp": "2026-03-25T13:00:00+01:00",
        "content_text": "Revisión HUB Decada - POL CAMI\nInvitado  \nArchivos adjuntos \n\n\nResumen\nEl resumen ejecutivo cubre el progreso del desarrollo de flujos de datos con la identificación de desafíos en la captura de transcripciones y el filtrado de correos electrónicos no interesantes.\u000b\u000bImplementación de Flujos de Datos\u000bSe ha avanzado en la implementación de 6 flujos de datos, incluyendo la creación de una base de datos para almacenar correos electrónicos y un flujo adicional para Google Calendar para registrar reuniones. La sincronización de correos entrantes se realiza cada 15 minutos, demostrando la funcionalidad básica de la plataforma.\u000b\u000bProblemas de Transcripción y Filtrado\u000bLa captura de transcripciones de reuniones presenta problemas de ubicación de archivos, lo que impide su procesamiento con el nodo actual. Se identificó la necesidad de refinar el análisis de IA de la satisfacción del cliente y de filtrar correos electrónicos irrelevantes como las confirmaciones de reuniones.\u000b\u000bMejoras de Correo Electrónico y Métricas\u000bLos planes futuros se centran en mejorar el filtrado de correos electrónicos, gestionar los hilos correctamente y extraer insights de las conversaciones. Se ha tomado la decisión de pulir la calidad de los datos y los flujos creados con Claude, enfocándose en la exclusión de correos específicos y la unificación de múltiples dominios de clientes.\n\n\nPróximos pasos\n[Pol Comas Romero] Pulir Flujos: Filtrar correos no interesantes. Revisar estatus de hilos para confirmar cierre.\n[Camila Aguado] Solicitar Accesos: Hablar con Alba para pedir 2 correos electrónicos de clientes. Obtener credenciales para comenzar pruebas reales.\n[Camila Aguado] Alinear Montex: Hablar con Sonia para alinear trabajo pendiente de Montex. Planificar tareas para la próxima semana.\n[Pol Comas Romero] Consultar Prácticas: Preguntar a la universidad sobre la posibilidad de extender las prácticas. Evaluar si se puede hacer como prácticas extracurriculares.\n\n\nDetalles\nProgreso en el Desarrollo de Flujos de Correo Electrónico y Calendario: Pol Comas Romero informó a Camila Aguado sobre el progreso en la implementación de seis flujos de datos en el *hub*, incluida la creación de una base de datos para almacenar correos electrónicos y la sincronización de correos entrantes cada 15 minutos. Se ha implementado un flujo adicional para Google Calendar que recoge eventos y los clasifica por cliente para registrar reuniones.\nDesafíos con la Captura de Transcripciones y Filtrado de Correo Electrónico: Se mencionó que la captura de transcripciones de reuniones presenta problemas, ya que algunas se guardan en la carpeta personal de Pol Comas Romero, mientras que otras se guardan en la carpeta *root*, lo que impide su captura mediante el nodo actual. También se identificó la necesidad de refinar el análisis de la satisfacción del cliente por la IA y de filtrar correos electrónicos considerados \"no interesantes\", como las confirmaciones de reuniones, para mejorar la calidad de los datos.\nMejoras Planificadas en el Procesamiento de Correo Electrónico y Métricas: Se planea mejorar el filtrado de correos electrónicos irrelevantes, gestionar correctamente los hilos (threads) de correo electrónico para asegurar que se guarden con el nombre del *thread*, y extraer *insights* de las conversaciones. Además, se están recopilando métricas clave, como el tiempo de respuesta promedio del equipo y de los clientes, e identificando hilos de correo \"estancados\" (aunque se necesita verificar si estos hilos están cerrados en lugar de simplemente estancados).\nRevisión y Ajuste de Flujos y Mails Descartados: El trabajo se centrará en pulir la calidad de los datos y los flujos creados con Claude, lo que incluye determinar qué correos deben descartarse y cómo, asegurando que no se repitan los datos. También se demostró cómo los correos de entidades específicas (como Fira Barcelona) pueden descartarse, mientras que los correos de múltiples dominios (como Vangreen y Montex) pueden unirse bajo un solo cliente.\nPróximos Pasos con el Cliente y Solicitud de Credenciales: Camila Aguado planea solicitar las credenciales de correo de dos clientes para comenzar las pruebas de clasificación por dominio y poner a prueba la implementación en un entorno real. Se confirmó que tienen el mes de abril para la implementación y los ajustes necesarios.\nCoordinación y Posible Extensión de las Prácticas: Pol Comas Romero viajará y regresará el lunes siguiente. Camila Aguado consultó sobre la posibilidad de extender las prácticas para Pol Comas Romero (posiblemente un par de meses) antes de considerar un acuerdo de contratación, para ganar más claridad. Pol Comas Romero indicó que consultará con la universidad sobre la extensión de las prácticas o si es posible realizar un proceso similar como prácticas \"extracurriculares\".\n\n\nRevisa las notas de Gemini para asegurarte de que sean precisas. Obtén sugerencias y descubre cómo Gemini toma notas\nCómo es la calidad de estas notas específicas? Responde una breve encuesta para darnos tu opinión; por ejemplo, cuán útiles te resultaron las notas."
      }
    ],
    "Resolve meeting": [
      {
        "meeting_id": null,
        "client_id": null
      }
    ],
    "Upsert transcript": [
      {
        "transcript_id": "8cc470cd-23a5-4da8-9c8b-ff75ca967802",
        "meeting_id": null,
        "client_id": null
      }
    ],
    "Google Drive Trigger": [
      {
        "exportLinks": {
          "application/rtf": "https://docs.google.com/feeds/download/documents/export/Export?id=1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8&exportFormat=rtf",
          "application/vnd.oasis.opendocument.text": "https://docs.google.com/feeds/download/documents/export/Export?id=1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8&exportFormat=odt",
          "text/html": "https://docs.google.com/feeds/download/documents/export/Export?id=1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8&exportFormat=html",
          "application/pdf": "https://docs.google.com/feeds/download/documents/export/Export?id=1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8&exportFormat=pdf",
          "text/x-markdown": "https://docs.google.com/feeds/download/documents/export/Export?id=1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8&exportFormat=markdown",
          "text/markdown": "https://docs.google.com/feeds/download/documents/export/Export?id=1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8&exportFormat=markdown",
          "application/epub+zip": "https://docs.google.com/feeds/download/documents/export/Export?id=1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8&exportFormat=epub",
          "application/zip": "https://docs.google.com/feeds/download/documents/export/Export?id=1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8&exportFormat=zip",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "https://docs.google.com/feeds/download/documents/export/Export?id=1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8&exportFormat=docx",
          "text/plain": "https://docs.google.com/feeds/download/documents/export/Export?id=1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8&exportFormat=txt"
        },
        "parents": [
          "1cjLoJkElBwmLrbSlQpYdWYfHEJbDtbl0"
        ],
        "lastModifyingUser": {
          "displayName": "Pol Comas Romero",
          "kind": "drive#user",
          "me": true,
          "permissionId": "07423026024375835587",
          "emailAddress": "pol@blumb.ai",
          "photoLink": "https://lh3.googleusercontent.com/a/ACg8ocLJpSra264uoWG6W1pHaICE-DHJ7k01ZowAs_ftmWX4BqX75g=s64"
        },
        "owners": [
          {
            "displayName": "Pol Comas Romero",
            "kind": "drive#user",
            "me": true,
            "permissionId": "07423026024375835587",
            "emailAddress": "pol@blumb.ai",
            "photoLink": "https://lh3.googleusercontent.com/a/ACg8ocLJpSra264uoWG6W1pHaICE-DHJ7k01ZowAs_ftmWX4BqX75g=s64"
          }
        ],
        "permissions": [
          {
            "kind": "drive#permission",
            "id": "05582478935605453636",
            "type": "user",
            "emailAddress": "camila@blumb.ai",
            "role": "writer",
            "displayName": "Camila Aguado",
            "photoLink": "https://lh3.googleusercontent.com/a-/ALV-UjUk-3SKAiBxxYVdyoUbNb0uXWyYe4NVszwoXTH17xLs5A55YOfb-dqQoxhMZ9NKCeS5UWxVjeLLL7Y57uQdk8gz--_TXVOVqQh3AErZ0qOrsK_M7V5vZ5u9oPPtpLfaHWyNOWh3dkg6rIHJ8P_cIqhNVSnjiDb89-Tdp_iPfDtdDXbEzRal_F31CvEagFcxdnXvsfugROc7PEKttk9jCAmEti3vV84viOLK4Ckw4RFfeWD_94ybtTTjGYmfrU4lU4NSxwLJJXfXQeNg3eXjci-Zj4HJ-Q_4MgomtKu4RXAfiLxVlsLcr5jE-w_QINEJtCogid8O9xcJVqh-oycTvs9B_w8jYZo-7uU0eWp5zp40Jl5nhjkOIpCVGSIscViik5J6BczntufKbEWuDEz5pG2py3J-BXB8lqLIf943N_YUU6RFR18B6cktt3xvOa6sbP4M4xUNJSE9iSmlFftVOpMsxVPj2Tu8D2TKk3aw4433O9N3aNLOWC6pfj94UBvi2gB31MQyxlSYdemkroQMu0thfp75UxQJq5CTZ5OSZeebyp0GDY-QBDwPibwuxUcNtXi_zxoMplR8TpVxyfeKY8a4xa1QVWdei4Iw2JxAvy12asc17ivpeAWZ9q79sprVozJA_VSZZXFnh-k0MZh7sS3tf11sM8e41Q7tyoBDfLSEgc5shc3Rj4-hh4FKgT3QS02_fGw1sXSHm4al-p7qw7nqBYIJ8ujFwWv4ggf919WxmkPcFTk6azk-X1-Y8ngE_5emn7DpXcwBU2ai1_rJ8VO2D7I9V73LtzoEaJY3E_Ctt79_FyCAH-G-tzy-IXT2F9k8gLQ66CRvbFvDwOlG0NixM4mmNQ8soTSTF9BwXE-dOgo04d5sd-tdLYC-NsRbjDTfMkMISo3RkDHWbM-GFXFkq8-Zzi0XYLMuwuuWFBTeie-GPaWc74dOcT6jRTk-bSIQHVLaq8SVNxhU5fsPI7Z64wVhJOHbAIDrQuLQmY3Tu4ZZFTmPl0NkuHhxFEtduWJ9bfjgAtl4vSKbCK_CC8g6GstmGv59logFVYu-xDyI54dR6VEuT3c=s64",
            "deleted": false,
            "pendingOwner": false
          },
          {
            "kind": "drive#permission",
            "id": "07423026024375835587",
            "type": "user",
            "emailAddress": "pol@blumb.ai",
            "role": "owner",
            "displayName": "Pol Comas Romero",
            "photoLink": "https://lh3.googleusercontent.com/a/ACg8ocLJpSra264uoWG6W1pHaICE-DHJ7k01ZowAs_ftmWX4BqX75g=s64",
            "deleted": false,
            "pendingOwner": false
          }
        ],
        "spaces": [
          "drive"
        ],
        "capabilities": {
          "canAcceptOwnership": false,
          "canAddChildren": false,
          "canAddMyDriveParent": false,
          "canChangeCopyRequiresWriterPermission": true,
          "canChangeItemDownloadRestriction": true,
          "canChangeSecurityUpdateEnabled": false,
          "canChangeViewersCanCopyContent": true,
          "canComment": true,
          "canCopy": true,
          "canDelete": true,
          "canDisableInheritedPermissions": false,
          "canDownload": true,
          "canEdit": true,
          "canEnableInheritedPermissions": true,
          "canListChildren": false,
          "canModifyContent": true,
          "canModifyContentRestriction": true,
          "canModifyEditorContentRestriction": true,
          "canModifyOwnerContentRestriction": true,
          "canModifyLabels": false,
          "canMoveChildrenWithinDrive": false,
          "canMoveItemIntoTeamDrive": true,
          "canMoveItemOutOfDrive": true,
          "canMoveItemWithinDrive": true,
          "canReadLabels": false,
          "canReadRevisions": true,
          "canRemoveChildren": false,
          "canRemoveContentRestriction": false,
          "canRemoveMyDriveParent": true,
          "canRename": true,
          "canShare": true,
          "canTrash": true,
          "canUntrash": true
        },
        "permissionIds": [
          "05582478935605453636",
          "07423026024375835587"
        ],
        "linkShareMetadata": {
          "securityUpdateEligible": false,
          "securityUpdateEnabled": true
        },
        "downloadRestrictions": {
          "itemDownloadRestriction": {
            "restrictedForReaders": false,
            "restrictedForWriters": false
          },
          "effectiveDownloadRestrictionWithContext": {
            "restrictedForReaders": false,
            "restrictedForWriters": false
          }
        },
        "kind": "drive#file",
        "id": "1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8",
        "name": "Revisión HUB Decada - POL CAMI - 2026/03/25 13:00 CET - Notas de Gemini",
        "mimeType": "application/vnd.google-apps.document",
        "starred": false,
        "trashed": false,
        "explicitlyTrashed": false,
        "version": "10",
        "webViewLink": "https://docs.google.com/document/d/1Aeul7ETG46HknnMgI76cGl6lP3xitf0duIjuvILi2E8/edit?usp=drivesdk",
        "iconLink": "https://drive-thirdparty.googleusercontent.com/16/type/application/vnd.google-apps.document",
        "hasThumbnail": true,
        "thumbnailLink": "https://lh3.googleusercontent.com/drive-storage/AJQWtBNNardkUwe5BCIub8hkbXjpzQPhYChgeHQ-66lCkVPoLR7zBDv-9Qsma6X6MbMu8kQ_ltId5V0u9iw34t7XN2oTBy7TFxFOIbAZBTE3xwwmZrrT8aqC-cTVPHsYyvXo=s220",
        "thumbnailVersion": "2",
        "viewedByMe": true,
        "viewedByMeTime": "2026-03-26T10:35:17.215Z",
        "createdTime": "2026-03-25T12:20:19.497Z",
        "modifiedTime": "2026-03-25T12:20:30.362Z",
        "modifiedByMeTime": "2026-03-25T12:20:30.362Z",
        "modifiedByMe": true,
        "shared": true,
        "ownedByMe": true,
        "viewersCanCopyContent": true,
        "copyRequiresWriterPermission": false,
        "writersCanShare": true,
        "size": "5916",
        "quotaBytesUsed": "5916",
        "isAppAuthorized": false,
        "inheritedPermissionsDisabled": false
      }
    ]
  },
  "meta": {
    "templateCredsSetupCompleted": true,
    "instanceId": "32ca23c584a6940310de9ccd89a8d02b720458089469cd8637c9651cf3659460"
  }
}