## Phase 12: OIDC Provider Expansion

Goal: Upgrade VAuth from central auth API to standards-compatible OAuth/OIDC provider.

Status: Deferred until the core VAuth API is stable.

Deliverables:

- Authorization server module.
- OIDC discovery.
- JWKS.
- Authorization Code with PKCE.
- id_token.

Tasks:
- [ ] Design authorization code storage.
- [ ] Add PKCE verifier/challenge support.
- [ ] Add /oauth/authorize.
- [ ] Add /oauth/token.
- [ ] Add /oauth/userinfo.
- [ ] Add /oauth/introspect.
- [ ] Add /.well-known/jwks.json.
- [ ] Add /.well-known/openid-configuration.
- [ ] Add asymmetric signing keys.
- [ ] Add key rotation.
- [ ] Add OIDC e2e tests.

Acceptance:
- [ ] VAuth acts as an OIDC provider.
- [ ] External apps can integrate using standard OAuth/OIDC flows.

### Phase 12: OIDC Provider Expansion Tracker

Status: Deferred

- [ ] Add authorization server module.
- [ ] Add `/oauth/authorize`.
- [ ] Add `/oauth/token`.
- [ ] Add `/oauth/userinfo`.
- [ ] Add `/oauth/introspect`.
- [ ] Add `/.well-known/jwks.json`.
- [ ] Add `/.well-known/openid-configuration`.
- [ ] Add Authorization Code with PKCE.
- [ ] Add `id_token`.
- [ ] Add key rotation.

Acceptance:

- [ ] VAuth acts as an OIDC provider, not only a central login API.
- [ ] External apps can integrate using standard OAuth/OIDC flows.



## Create repository and push to github
```
git init
git add .
git commit -m "Pushing VAuth v1"
git branch -M main
git remote add origin https://github.com/VCji21/VAuth.git
git push -u origin main
```

git config --global core.safecrlf false