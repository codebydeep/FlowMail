package com.flowmail.email.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;
import org.springframework.kafka.core.KafkaAdmin;
import org.springframework.web.client.RestTemplate;
import org.apache.kafka.clients.admin.NewTopic;

@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public NewTopic emailReceivedTopic() {
        return TopicBuilder.name("email.received").partitions(1).replicas(1).build();
    }
}
