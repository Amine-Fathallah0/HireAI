package com.riadh.gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import reactor.core.publisher.Mono;

import java.util.Objects;

/**
 * Gateway Configuration for Rate Limiting
 * 
 * This class configures the KeyResolver for rate limiting based on client IP addresses.
 * Each IP address is tracked separately in Redis for distributed rate limiting.
 */
@Configuration
public class GatewayConfig {

    /**
     * KeyResolver that uses the client's IP address for rate limiting.
     * 
     * This ensures that rate limits are applied per IP address, preventing
     * a single client from overwhelming the API.
     * 
     * In production, consider:
     * - Using X-Forwarded-For header if behind a proxy/load balancer
     * - Implementing authenticated user-based rate limiting for logged-in users
     * - Combining IP and user-based rate limiting for better control
     */
    @Bean
    @Primary
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            // Get the remote address (IP) from the request
            String ip = Objects.requireNonNull(
                exchange.getRequest().getRemoteAddress()
            ).getAddress().getHostAddress();
            
            // Return the IP as the key for rate limiting
            return Mono.just(ip);
        };
    }

    /**
     * Alternative: KeyResolver based on authenticated user
     * Uncomment and use this if you want to rate limit per authenticated user instead of IP
     */
    // @Bean
    // public KeyResolver userKeyResolver() {
    //     return exchange -> exchange.getPrincipal()
    //         .map(Principal::getName)
    //         .defaultIfEmpty("anonymous");
    // }

    /**
     * Alternative: KeyResolver based on API Key
     * Uncomment and use this if you're using API keys
     */
    // @Bean
    // public KeyResolver apiKeyResolver() {
    //     return exchange -> {
    //         String apiKey = exchange.getRequest().getHeaders().getFirst("X-API-Key");
    //         return Mono.just(apiKey != null ? apiKey : "anonymous");
    //     };
    // }
}

