const fetch = require('node-fetch');

class NetlifyAPI {
  constructor(token) {
    this.token = token;
    this.baseUrl = 'https://api.netlify.com/api/v1';
  }

  async getSite(siteId) {
    const res = await fetch(`${this.baseUrl}/sites/${siteId}`, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });
    return res.json();
  }

  async updateSite(siteId, data) {
    const res = await fetch(`${this.baseUrl}/sites/${siteId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async addDomainAlias(siteId, domain) {
    const site = await this.getSite(siteId);
    const aliases = site.domain_aliases || [];
    if (!aliases.includes(domain)) {
      aliases.push(domain);
      return this.updateSite(siteId, { domain_aliases: aliases });
    }
    return site;
  }

  async removeDomainAlias(siteId, domain) {
    const site = await this.getSite(siteId);
    const aliases = (site.domain_aliases || []).filter(d => d !== domain);
    return this.updateSite(siteId, { domain_aliases: aliases });
  }
}

module.exports = NetlifyAPI;
