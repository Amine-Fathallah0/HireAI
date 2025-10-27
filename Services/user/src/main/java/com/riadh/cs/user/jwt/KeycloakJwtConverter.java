package com.riadh.cs.user.jwt;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Converts Keycloak JWT tokens to Spring Security Authentication objects
 * Extracts roles from realm_access and resource_access claims
 */
public class KeycloakJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final JwtGrantedAuthoritiesConverter defaultGrantedAuthoritiesConverter = new JwtGrantedAuthoritiesConverter();
    
    private static final String REALM_ACCESS_CLAIM = "realm_access";
    private static final String RESOURCE_ACCESS_CLAIM = "resource_access";
    private static final String ROLES_CLAIM = "roles";

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = Stream.concat(
                defaultGrantedAuthoritiesConverter.convert(jwt).stream(),
                extractAuthorities(jwt).stream()
        ).collect(Collectors.toSet());

        return new JwtAuthenticationToken(jwt, authorities, jwt.getClaimAsString("preferred_username"));
    }

    private Collection<GrantedAuthority> extractAuthorities(Jwt jwt) {
        // Extract realm roles
        Collection<GrantedAuthority> realmRoles = extractRealmRoles(jwt);
        
        // Extract resource/client roles
        Collection<GrantedAuthority> resourceRoles = extractResourceRoles(jwt);

        return Stream.concat(realmRoles.stream(), resourceRoles.stream())
                .collect(Collectors.toSet());
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim(REALM_ACCESS_CLAIM);
        
        if (realmAccess == null || realmAccess.get(ROLES_CLAIM) == null) {
            return Collections.emptySet();
        }

        Collection<String> roles = (Collection<String>) realmAccess.get(ROLES_CLAIM);
        
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .collect(Collectors.toSet());
    }

    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractResourceRoles(Jwt jwt) {
        Map<String, Object> resourceAccess = jwt.getClaim(RESOURCE_ACCESS_CLAIM);
        
        if (resourceAccess == null) {
            return Collections.emptySet();
        }

        return resourceAccess.entrySet().stream()
                .flatMap(entry -> {
                    String resource = entry.getKey();
                    Map<String, Object> resourceData = (Map<String, Object>) entry.getValue();
                    
                    if (resourceData.get(ROLES_CLAIM) == null) {
                        return Stream.empty();
                    }
                    
                    Collection<String> roles = (Collection<String>) resourceData.get(ROLES_CLAIM);
                    
                    return roles.stream()
                            .map(role -> new SimpleGrantedAuthority("ROLE_" + resource.toUpperCase() + "_" + role.toUpperCase()));
                })
                .collect(Collectors.toSet());
    }
}



