/* eslint-disable import/no-cycle */
import { getCookie } from '@dropins/tools/lib.js';
import { readBlockConfig } from '../../scripts/aem.js';
import { CORE_FETCH_GRAPHQL, checkIsAuthenticated } from '../../scripts/commerce.js';

/**
 * Customer Segment Content block
 * Dynamically displays content based on customer segments retrieved via GraphQL.
 *
 * @param {HTMLElement} block
 */
export default async function decorate(block) {
  // Read block config (from block's own content)
  const blockConfig = readBlockConfig(block);

  // Read section metadata config (from section-metadata block)
  // Note: section-metadata can be in the same section OR in adjacent sections
  const section = block.closest('.section');
  let sectionConfig = {};
  let sectionMeta = null;

  // Method 1: Check current section
  if (section) {
    sectionMeta = section.querySelector('.section-metadata.block');
    if (!sectionMeta) {
      sectionMeta = section.querySelector('div.section-metadata');
    }
    if (!sectionMeta) {
      sectionMeta = section.querySelector('.block.section-metadata');
    }
  }

  // Method 2: If not found, check previous sibling section
  if (!sectionMeta && section?.previousElementSibling) {
    const prevSection = section.previousElementSibling;
    if (prevSection.classList.contains('section')) {
      sectionMeta = prevSection.querySelector('.section-metadata.block');
      if (!sectionMeta) {
        sectionMeta = prevSection.querySelector('div.section-metadata');
      }
    }
  }

  // Method 3: If not found, check next sibling section
  if (!sectionMeta && section?.nextElementSibling) {
    const nextSection = section.nextElementSibling;
    // Check if it has section class or just check for section-metadata inside it
    sectionMeta = nextSection.querySelector('.section-metadata.block');
    if (!sectionMeta) {
      sectionMeta = nextSection.querySelector('div.section-metadata');
    }
    if (!sectionMeta) {
      sectionMeta = nextSection.querySelector('.block.section-metadata');
    }
    // Also check if the nextElementSibling IS the section-metadata itself
    if (!sectionMeta && nextSection.classList.contains('section-metadata')) {
      sectionMeta = nextSection;
    }
  }

  // Method 4: If still not found, check parent's next sibling (for cases where
  // section-metadata is a direct sibling div, not inside a section)
  if (!sectionMeta && section?.parentElement) {
    const parent = section.parentElement;
    const sectionIndex = Array.from(parent.children).indexOf(section);
    if (sectionIndex >= 0 && sectionIndex < parent.children.length - 1) {
      const nextSibling = parent.children[sectionIndex + 1];
      // Check if next sibling is section-metadata or contains it
      if (nextSibling.classList.contains('section-metadata')) {
        sectionMeta = nextSibling;
      } else {
        sectionMeta = nextSibling.querySelector('.section-metadata');
      }
    }
  }

  // Method 5: If still not found, search all section-metadata blocks in document
  // (as fallback - might find wrong one, but better than nothing)
  if (!sectionMeta) {
    const allSectionMetas = document.querySelectorAll(
      '.section-metadata.block, div.section-metadata, .block.section-metadata',
    );
    // Use the first one found (or the one closest to our block)
    if (allSectionMetas.length > 0) {
      // Find the one closest to our block
      let closestMeta = null;
      let closestDistance = Infinity;
      allSectionMetas.forEach((meta) => {
        const metaSection = meta.closest('.section');
        const blockSection = block.closest('.section');
        if (
          metaSection
          && blockSection
          && metaSection.parentElement === blockSection.parentElement
        ) {
          // Same parent (e.g., both in main)
          const distance = Math.abs(
            Array.from(blockSection.parentElement.children).indexOf(blockSection)
            - Array.from(blockSection.parentElement.children).indexOf(metaSection),
          );
          if (distance < closestDistance) {
            closestDistance = distance;
            closestMeta = meta;
          }
        } else if (!metaSection || !blockSection) {
          // If not in sections, check direct parent children
          const metaParent = meta.parentElement;
          const blockParent = block.closest('.section')?.parentElement || block.parentElement;
          if (metaParent === blockParent) {
            const distance = Math.abs(
              Array.from(blockParent.children).indexOf(block.closest('.section') || block)
              - Array.from(blockParent.children).indexOf(meta),
            );
            if (distance < closestDistance) {
              closestDistance = distance;
              closestMeta = meta;
            }
          }
        }
      });
      sectionMeta = closestMeta || allSectionMetas[0];
    }
  }

  // Read config from found section-metadata block
  if (sectionMeta) {
    sectionConfig = readBlockConfig(sectionMeta);
  }

  // Also check if section metadata was already processed and stored in section dataset
  // (section-metadata blocks get removed after processing)
  if (!sectionMeta && section) {
    // Check section dataset for already-processed metadata
    const sectionDataKeys = Object.keys(section.dataset || {});
    const metadataKeys = sectionDataKeys.filter((key) => (
      key.includes('segment') || key.includes('group') || key === 'debug' || key === 'requireAuth'
    ));

    if (metadataKeys.length > 0) {
      // Convert dataset keys back to config format
      metadataKeys.forEach((key) => {
        // Convert camelCase to kebab-case
        const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        sectionConfig[kebabKey] = section.dataset[key];
      });
    }

    // Also check next sibling section's dataset
    if (section.nextElementSibling) {
      const nextDataKeys = Object.keys(section.nextElementSibling.dataset || {});
      const nextMetadataKeys = nextDataKeys.filter((key) => (
        key.includes('segment') || key.includes('group') || key === 'debug' || key === 'requireAuth'
      ));

      nextMetadataKeys.forEach((key) => {
        const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        sectionConfig[kebabKey] = section.nextElementSibling.dataset[key];
      });
    }
  }

  // Merge block config and section config (section config takes precedence)
  const config = { ...blockConfig, ...sectionConfig };

  // Get customer token for authentication
  const customerToken = getCookie('auth_dropin_user_token');
  const isAuthenticated = checkIsAuthenticated();

  // Find default content - check both .default-content class and block config
  const defaultContent = block.querySelector('.default-content');

  // Also check if default text is in block config
  // readBlockConfig converts "Default Text" to "default-text" (kebab-case)
  // Also check for original case variations
  const defaultText = blockConfig['default-text']
    || blockConfig['Default Text']
    || blockConfig.defaultText
    || config['default-text']
    || config['Default Text'];

  // Also check the block's HTML structure for default text and image
  // If block has rows with "Default Text" or "Default Image" label, extract the value from next row
  let extractedDefaultText = null;
  let defaultImage = null;
  const blockRows = block.querySelectorAll(':scope > div');

  // Also check for default image in block config
  const defaultImageKey = blockConfig['default-image']
    || blockConfig['Default Image']
    || blockConfig.defaultImage
    || config['default-image']
    || config['Default Image'];

  if (defaultImageKey) {
    defaultImage = defaultImageKey;
  } else {
    // Extract default image from block structure if not in config
    blockRows.forEach((row, index) => {
      if (row.children && row.children.length >= 2) {
        const label = row.children[0]?.textContent?.trim();
        if (label && label.toLowerCase() === 'default image' && !defaultImage) {
          // Check if next row has an image or if this row contains an image
          const rowImage = row.querySelector('img') || row.querySelector('picture img');
          if (rowImage) {
            defaultImage = rowImage.src;
          } else if (index < blockRows.length - 1) {
            const nextRow = blockRows[index + 1];
            const nextRowImage = nextRow.querySelector('img') || nextRow.querySelector('picture img');
            if (nextRowImage) {
              defaultImage = nextRowImage.src;
            }
          }
        }
      }
    });
  }
  blockRows.forEach((row, index) => {
    if (row.children && row.children.length >= 2) {
      const label = row.children[0]?.textContent?.trim();
      const value = row.children[1]?.textContent?.trim();
      if (label && label.toLowerCase() === 'default text' && !value) {
        // If this row has "Default Text" label but no value, check next row
        if (index < blockRows.length - 1) {
          const nextRow = blockRows[index + 1];
          if (nextRow.children && nextRow.children.length >= 2) {
            const nextValue = nextRow.children[1]?.textContent?.trim();
            if (nextValue && !nextRow.children[0]?.textContent?.trim()) {
              // Next row has value but no label - this is likely our default text
              extractedDefaultText = nextValue;
            }
          } else if (nextRow.textContent.trim()) {
            // Next row has text content
            extractedDefaultText = nextRow.textContent.trim();
          }
        }
      } else if (label && label.toLowerCase() === 'default text' && value) {
        // Label and value are in same row
        extractedDefaultText = value;
      }
    }
  });

  // Use extracted text or config text
  const finalDefaultText = extractedDefaultText || defaultText;

  if (!isAuthenticated && config['require-auth'] === 'true') {
    // Hide block if auth required but user not authenticated (unless default exists)
    if (!defaultContent && !finalDefaultText) {
      block.style.display = 'none';
      return;
    }
  }

  // Store reference to default content and text for later use
  // Always show default content initially for better UX
  if (defaultContent) {
    // Clear block and show default content (includes default image if present)
    block.innerHTML = '';
    block.append(defaultContent.cloneNode(true));
  } else if (finalDefaultText || defaultImage) {
    // If no .default-content element but we have default-text or default-image config, create it
    block.innerHTML = '';

    // Add default image if available
    if (defaultImage) {
      const picture = document.createElement('picture');
      const img = document.createElement('img');
      img.src = defaultImage;
      img.alt = 'Default banner';
      img.loading = 'lazy';
      picture.append(img);
      block.append(picture);
    }

    // Add default text if available
    if (finalDefaultText) {
      const p = document.createElement('p');
      p.textContent = finalDefaultText;
      p.className = 'default-message';
      block.append(p);
    }
  } else {
    // Check if block has existing content to display
    const existingText = block.textContent.trim();
    // If block has meaningful content, keep it
    if (existingText && existingText !== 'Default Text' && existingText.length > 0) {
      // Keep existing content
    } else {
      // Show fallback default message
      block.innerHTML = '';
      const p = document.createElement('p');
      p.textContent = 'Welcome to our store!';
      p.className = 'default-message';
      block.append(p);
    }
  }

  // For non-authenticated users, stop here - default content is already shown above
  // Personalized content loading will only run for authenticated users (see below)

  // Defer GraphQL call to avoid blocking initial render
  // Use requestIdleCallback if available, otherwise setTimeout
  const loadPersonalizedContent = async () => {
    // Re-check authentication status (may have changed since page load)
    const currentIsAuthenticated = checkIsAuthenticated();
    const currentCustomerToken = getCookie('auth_dropin_user_token');

    // If not authenticated, show default content and exit
    if (!currentIsAuthenticated || !currentCustomerToken) {
      // Restore default content if available
      const defaultContentEl = block.querySelector('.default-content');
      if (defaultContentEl || defaultContent) {
        // Clear block and show default content
        block.innerHTML = '';
        if (defaultContent) {
          block.append(defaultContent.cloneNode(true));
        } else if (defaultContentEl) {
          block.append(defaultContentEl.cloneNode(true));
        }
      }
      return; // Exit early for non-authenticated users
    }

    let customerGroupUid = null;
    let segmentUids = [];
    // Store both decoded and original (base64) UIDs for matching
    const segmentUidMap = new Map(); // decoded -> original

    // First try personalization API (usually faster and more reliable)
    try {
      const { getPersonalizationData } = await import('@dropins/storefront-personalization/api.js');
      const personalizationData = getPersonalizationData();

      if (personalizationData?.segments?.length) {
        segmentUids = personalizationData.segments.map((uid) => {
          // Try to decode if base64
          try {
            const decoded = atob(uid);
            if (!Number.isNaN(Number(decoded))) {
              // Store mapping of decoded to original
              segmentUidMap.set(decoded, uid);
              return decoded;
            }
          } catch {
            // Not base64 or decode failed
          }
          segmentUidMap.set(uid, uid); // Store as-is
          return uid;
        });
      }
      if (personalizationData?.groups?.length && !customerGroupUid) {
        const [firstGroup] = personalizationData.groups;
        // Try to decode base64 group UID
        try {
          const decoded = atob(firstGroup);
          if (!Number.isNaN(Number(decoded))) {
            customerGroupUid = decoded;
          } else {
            customerGroupUid = firstGroup;
          }
        } catch {
          customerGroupUid = firstGroup;
        }
      }

      // Don't use group UID as segment - only use actual customer segments
      // Customer groups and segments are different concepts
    } catch (err) {
      // Personalization API not available, continue with GraphQL
    }

    // Also try GraphQL if authenticated and no segments found yet
    if (currentIsAuthenticated && currentCustomerToken && !segmentUids.length) {
      try {
        // Set auth header for GraphQL requests
        const authHeader = `Bearer ${currentCustomerToken}`;
        CORE_FETCH_GRAPHQL.setFetchGraphQlHeaders((prev) => ({
          ...prev,
          Authorization: authHeader,
        }));

        // Query customer data including group and segments
        const customerQuery = `
        query GET_CUSTOMER {
          customer {
            group {
              uid
            }
            segments {
              uid
            }
          }
        }
        `;

        const response = await CORE_FETCH_GRAPHQL.fetchGraphQl(customerQuery, {
          method: 'GET',
          cache: 'default',
        });

        if (response?.data?.customer) {
          // Decode group UID if it's base64 encoded
          const rawGroupUid = response.data.customer.group?.uid || null;
          if (rawGroupUid) {
            try {
              // Try to decode base64 UID (e.g., "MQ==" -> "1")
              const decoded = atob(rawGroupUid);
              // Check if decoded value is a number (group ID)
              if (!Number.isNaN(Number(decoded))) {
                customerGroupUid = decoded;
              } else {
                customerGroupUid = rawGroupUid;
              }
            } catch {
              // If decode fails, use original UID
              customerGroupUid = rawGroupUid;
            }
          }

          // Get segments from GraphQL response
          // Segment UIDs from GraphQL are base64 encoded, decode them for matching
          if (response.data.customer.segments && Array.isArray(response.data.customer.segments)) {
            segmentUids = response.data.customer.segments.map((seg) => {
              const originalUid = seg.uid;
              try {
                // Try to decode base64 UID (e.g., "MQ==" -> "1")
                const decoded = atob(originalUid);
                // Check if decoded value is a number (segment ID)
                if (!Number.isNaN(Number(decoded))) {
                  // Store mapping of decoded to original
                  segmentUidMap.set(decoded, originalUid);
                  return decoded;
                }
                // If not a number or decode fails, return original
                segmentUidMap.set(originalUid, originalUid);
                return originalUid;
              } catch {
                // If decode fails, return original UID
                segmentUidMap.set(originalUid, originalUid);
                return originalUid;
              }
            });
          }

          // Don't use group UID as segment - only use actual customer segments from GraphQL
          // Customer groups and segments are different concepts
        }
      } catch (error) {
        // Failed to fetch customer data from GraphQL, continue with default content
      }
    }

    // Process block configuration for segment-based content
    const segmentContentMap = {};
    const currentDefaultContent = block.querySelector('.default-content');

    // Parse segment configurations from block config
    // Format: segment-{segmentUid}-{type} = value
    // Also supports: segment-{base64Uid}-{type} = value (e.g., segment-MQ==-text-content)
    Object.keys(config).forEach((key) => {
      if (key.startsWith('segment-')) {
        const parts = key.split('-');
        if (parts.length >= 3) {
          const segmentUid = parts[1]; // Could be "1" or "MQ=="
          const contentType = parts.slice(2).join('-');

          // Store both the exact UID and try to decode if it's base64
          if (!segmentContentMap[segmentUid]) {
            segmentContentMap[segmentUid] = {};
          }
          segmentContentMap[segmentUid][contentType] = config[key];

          // Also try to decode base64 UID and store with decoded key
          try {
            const decoded = atob(segmentUid);
            if (!Number.isNaN(Number(decoded))) {
              // Store with decoded key too (e.g., "1")
              if (!segmentContentMap[decoded]) {
                segmentContentMap[decoded] = {};
              }
              segmentContentMap[decoded][contentType] = config[key];
            }
          } catch {
            // Not base64, skip
          }
        }
      } else if (key.startsWith('group-')) {
        // Note: Group-based matching is deprecated in favor of segment-based matching
        // Keeping this for backwards compatibility, but segments are preferred
        const parts = key.split('-');
        if (parts.length >= 3) {
          const groupUid = parts[1];
          const contentType = parts.slice(2).join('-');

          if (!segmentContentMap[`group-${groupUid}`]) {
            segmentContentMap[`group-${groupUid}`] = {};
          }
          segmentContentMap[`group-${groupUid}`][contentType] = config[key];

          // Also try to decode base64 group UID
          try {
            const decoded = atob(groupUid);
            if (!Number.isNaN(Number(decoded))) {
              if (!segmentContentMap[`group-${decoded}`]) {
                segmentContentMap[`group-${decoded}`] = {};
              }
              segmentContentMap[`group-${decoded}`][contentType] = config[key];
            }
          } catch {
            // Not base64, skip
          }
        }
      }
    });

    // Determine which content to show based on segments ONLY
    // Note: We use segments, not customer groups, for matching
    let matchedContent = null;
    const allIdentifiers = segmentUids;

    // Find first matching segment or group
    // Check both decoded and original (base64) versions
    const matchedIdentifier = allIdentifiers.find((identifier) => {
      // First check the decoded/current identifier directly
      if (segmentContentMap[identifier]) {
        return true;
      }
      // If not found, check the original base64 version
      const originalUid = segmentUidMap.get(identifier);
      if (originalUid && segmentContentMap[originalUid]) {
        return true;
      }
      // Also check if identifier is numeric, try matching against segment-MQ== keys
      if (!Number.isNaN(Number(identifier))) {
        // Try to encode as base64 and check
        try {
          const base64Uid = btoa(identifier);
          if (segmentContentMap[base64Uid]) {
            return true;
          }
        } catch {
          // Encoding failed, skip
        }
      }
      return false;
    });

    if (matchedIdentifier) {
      // Try to get content in order: direct match, original UID, base64 version
      matchedContent = segmentContentMap[matchedIdentifier];
      if (!matchedContent) {
        const originalUid = segmentUidMap.get(matchedIdentifier);
        if (originalUid) {
          matchedContent = segmentContentMap[originalUid];
        }
      }
      // If still not found and identifier is numeric, try base64 version
      if (!matchedContent && !Number.isNaN(Number(matchedIdentifier))) {
        try {
          const base64Uid = btoa(matchedIdentifier);
          matchedContent = segmentContentMap[base64Uid];
        } catch {
          // Encoding failed
        }
      }
    }

    // Apply content changes
    if (matchedContent) {
      // Update banner/hero image if configured
      // Support both 'banner-image' and 'image-content' keys
      const imageUrl = matchedContent['banner-image'] || matchedContent['image-content'];
      if (imageUrl) {
        // Try to find image in various places (hero block, picture element, or direct img)
        let imgElement = block.querySelector('picture img');
        if (!imgElement) {
          imgElement = block.querySelector('img');
        }
        if (imgElement) {
          imgElement.loading = 'lazy';
          imgElement.src = imageUrl;
          imgElement.alt = matchedContent['banner-image-alt']
            || matchedContent['image-content-alt']
            || imgElement.alt;
        } else {
          // No image found, create one
          const picture = document.createElement('picture');
          const img = document.createElement('img');
          img.src = imageUrl;
          img.alt = matchedContent['banner-image-alt']
            || matchedContent['image-content-alt']
            || 'Segment banner';
          img.loading = 'lazy';
          picture.append(img);
          // Insert at the beginning of the block
          block.insertBefore(picture, block.firstChild);
        }
      }

      // Update text content - REPLACE default message, don't append
      if (matchedContent['text-content']) {
        // First, remove any existing text content to avoid duplicates
        const allTextElements = Array.from(block.querySelectorAll('p, h1, h2, h3, h4, h5, h6'));
        let textUpdated = false;

        if (allTextElements.length > 0) {
          // Strategy 1: Replace all text elements with a single new one
          const elementsToRemove = allTextElements.slice(0, -1);
          elementsToRemove.forEach((el) => el.remove());
          const lastElement = allTextElements[allTextElements.length - 1];
          lastElement.textContent = matchedContent['text-content'];
          textUpdated = true;
        }

        // Strategy 2: If no text elements, find divs with text and replace
        if (!textUpdated) {
          const divsWithText = Array.from(block.querySelectorAll('div')).filter(
            (div) => div.textContent && div.textContent.trim().length > 0 && !div.querySelector('p, h1, h2, h3, h4, h5, h6'),
          );
          if (divsWithText.length > 0) {
            const targetDiv = divsWithText[divsWithText.length - 1];
            for (let i = 0; i < divsWithText.length - 1; i += 1) {
              divsWithText[i].remove();
            }
            targetDiv.textContent = matchedContent['text-content'];
            textUpdated = true;
          }
        }

        // Strategy 3: If still not updated, clear block and create new paragraph
        if (!textUpdated) {
          block.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach((el) => el.remove());
          const p = document.createElement('p');
          p.textContent = matchedContent['text-content'];
          p.className = 'segment-text-content';
          block.append(p);
        }
      }

      // Update HTML content
      if (matchedContent['html-content']) {
        const container = block.querySelector('.segment-content') || block;
        container.innerHTML = matchedContent['html-content'];
      }

      // Show/hide elements based on segment
      if (matchedContent['show-elements']) {
        const selector = matchedContent['show-elements'];
        block.querySelectorAll(selector).forEach((el) => {
          el.style.display = '';
          el.classList.remove('segment-hidden');
        });
      }

      if (matchedContent['hide-elements']) {
        const selector = matchedContent['hide-elements'];
        block.querySelectorAll(selector).forEach((el) => {
          el.style.display = 'none';
          el.classList.add('segment-hidden');
        });
      }
    } else if (currentDefaultContent) {
      // Show default content if no segment match
      block.textContent = '';
      block.append(currentDefaultContent.cloneNode(true));
    } else if (config['hide-if-no-match'] === 'true') {
      block.style.display = 'none';
    } else if (!matchedContent) {
      // If no match and no default content, restore original default content
      if (defaultContent) {
        block.innerHTML = '';
        block.append(defaultContent.cloneNode(true));
      } else {
        // Restore default image and text from config
        block.innerHTML = '';

        // Restore default image
        if (defaultImage) {
          const picture = document.createElement('picture');
          const img = document.createElement('img');
          img.src = defaultImage;
          img.alt = 'Default banner';
          img.loading = 'lazy';
          picture.append(img);
          block.append(picture);
        }

        // Restore default text
        if (finalDefaultText) {
          const p = document.createElement('p');
          p.textContent = finalDefaultText;
          p.className = 'default-message';
          block.append(p);
        }
      }
    }

    // Add debug info if enabled
    if (config.debug === 'true') {
      const debugInfo = document.createElement('div');
      debugInfo.className = 'segment-debug';
      debugInfo.style.cssText = 'padding: 10px; background: #f0f0f0; margin-top: 10px; font-size: 12px;';
      debugInfo.innerHTML = `
      <strong>Debug Info:</strong><br>
      Authenticated: ${currentIsAuthenticated}<br>
      Group UID: ${customerGroupUid || 'N/A'}<br>
      Segment UIDs: ${segmentUids.length ? segmentUids.join(', ') : 'N/A'}<br>
      All Identifiers: ${allIdentifiers.join(', ')}<br>
      Available Config Keys: ${Object.keys(segmentContentMap).join(', ')}<br>
      Matched Identifier: ${matchedIdentifier || 'None'}<br>
      Matched: ${matchedContent ? 'Yes' : 'No'}<br>
      Config Keys (all): ${Object.keys(config).filter((k) => k.includes('segment') || k.includes('group')).join(', ')}
    `;
      block.append(debugInfo);
    }
  };

  // Execute personalized content loading ONLY if user is authenticated
  // For non-authenticated users, keep showing default content
  if (isAuthenticated && customerToken) {
    // Defer execution to avoid blocking render
    // Use a longer delay for better LCP scores
    if (typeof requestIdleCallback !== 'undefined') {
      // Use a longer timeout to allow initial render to complete
      requestIdleCallback(() => {
        // Further defer with setTimeout to ensure it's truly non-blocking
        setTimeout(loadPersonalizedContent, 100);
      }, { timeout: 3000 });
    } else {
      // Fallback: use setTimeout with a small delay
      setTimeout(loadPersonalizedContent, 100);
    }
  }
  // If not authenticated, default content is already shown above, so do nothing
}
