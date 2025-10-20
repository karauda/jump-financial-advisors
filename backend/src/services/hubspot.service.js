const hubspot = require('@hubspot/api-client');

function getHubSpotClient(accessToken) {
  const client = new hubspot.Client({ accessToken });
  return client;
}

async function listContacts(accessToken, limit = 100, after = null) {
  const client = getHubSpotClient(accessToken);

  try {
    const params = { limit };
    if (after) params.after = after;

    const response = await client.crm.contacts.basicApi.getPage(
      limit,
      after,
      undefined,
      undefined,
      undefined,
      ['email', 'firstname', 'lastname', 'company', 'phone', 'notes_last_contacted']
    );

    return response;
  } catch (error) {
    console.error('Error listing HubSpot contacts:', error);
    throw error;
  }
}

async function getContact(accessToken, contactId) {
  const client = getHubSpotClient(accessToken);

  try {
    const response = await client.crm.contacts.basicApi.getById(
      contactId,
      ['email', 'firstname', 'lastname', 'company', 'phone', 'notes_last_contacted']
    );

    return response;
  } catch (error) {
    console.error('Error getting HubSpot contact:', error);
    throw error;
  }
}

async function searchContacts(accessToken, query) {
  const client = getHubSpotClient(accessToken);

  try {
    // Validate query is not empty
    if (!query || query.trim().length === 0) {
      // If no query, list all contacts
      const allContacts = await listContacts(accessToken, 10);
      return allContacts.results || [];
    }

    const searchRequest = {
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'email',
              operator: 'CONTAINS_TOKEN',
              value: query.trim(),
            },
          ],
        },
        {
          filters: [
            {
              propertyName: 'firstname',
              operator: 'CONTAINS_TOKEN',
              value: query.trim(),
            },
          ],
        },
        {
          filters: [
            {
              propertyName: 'lastname',
              operator: 'CONTAINS_TOKEN',
              value: query.trim(),
            },
          ],
        },
      ],
      properties: ['email', 'firstname', 'lastname', 'company', 'phone'],
      limit: 10,
      sorts: [],
      query: '',
    };

    const response = await client.crm.contacts.searchApi.doSearch(searchRequest);
    return response.results || [];
  } catch (error) {
    console.error('Error searching HubSpot contacts:', error);
    // Fallback to listing all contacts
    try {
      const allContacts = await listContacts(accessToken, 10);
      return allContacts.results || [];
    } catch (fallbackError) {
      throw error;
    }
  }
}

async function createContact(accessToken, properties) {
  const client = getHubSpotClient(accessToken);

  try {
    const response = await client.crm.contacts.basicApi.create({
      properties,
    });

    return response;
  } catch (error) {
    console.error('Error creating HubSpot contact:', error);
    throw error;
  }
}

async function updateContact(accessToken, contactId, properties) {
  const client = getHubSpotClient(accessToken);

  try {
    const response = await client.crm.contacts.basicApi.update(contactId, {
      properties,
    });

    return response;
  } catch (error) {
    console.error('Error updating HubSpot contact:', error);
    throw error;
  }
}

async function createNote(accessToken, contactId, noteContent) {
  const client = getHubSpotClient(accessToken);

  try {
    // Create engagement (note)
    const response = await client.crm.objects.notes.basicApi.create({
      properties: {
        hs_timestamp: Date.now(),
        hs_note_body: noteContent,
      },
      associations: [
        {
          to: { id: contactId },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 202, // Note to Contact association
            },
          ],
        },
      ],
    });

    return response;
  } catch (error) {
    console.error('Error creating HubSpot note:', error);
    throw error;
  }
}

async function getContactNotes(accessToken, contactId) {
  const client = getHubSpotClient(accessToken);

  try {
    const response = await client.crm.contacts.associationsApi.getAll(
      contactId,
      'notes'
    );

    if (!response.results || response.results.length === 0) {
      return [];
    }

    // Fetch note details
    const notes = await Promise.all(
      response.results.map(async (assoc) => {
        const note = await client.crm.objects.notes.basicApi.getById(
          assoc.id,
          ['hs_note_body', 'hs_timestamp']
        );
        return note;
      })
    );

    return notes;
  } catch (error) {
    console.error('Error getting HubSpot contact notes:', error);
    throw error;
  }
}

module.exports = {
  getHubSpotClient,
  listContacts,
  getContact,
  searchContacts,
  createContact,
  updateContact,
  createNote,
  getContactNotes,
};
